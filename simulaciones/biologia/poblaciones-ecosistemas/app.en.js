/* Poblaciones y ecosistemas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f0 = function (x) { return fmt(x, 0); }, f2 = function (x) { return fmt(x, 2); };
  var S = { N: 20, P: 0, C: 0, r: 0.9, K: 400, a: 0.015, b: 0.2, m: 0.3, pred: false, inv: false, hunt: 0, hab: 0, logi: true, t: 0, hist: [] };
  var G = {}, lab = {}, preyM, predM, invM, dm, R = 9;
  function Keff() { return S.K * (1 - S.hab); }
  function deriv(N, P, C) {
    var K = Keff(), dN = S.r * N * (S.logi ? 1 - (N + 1.2 * C) / K : 1) - S.a * N * P, dC = S.inv ? 1.1 * S.r * C * (1 - (C + 0.6 * N) / K) - S.a * 0.6 * C * P : 0, dP = S.pred ? S.b * S.a * (N + 0.6 * C) * P - (S.m + S.hunt) * P : 0;
    return [dN, dP, dC];
  }
  function step(dt) {
    var n = 20, h = dt / n;
    for (var k = 0; k < n; k++) { var d = deriv(S.N, S.P, S.C); S.N = Math.max(0, S.N + d[0] * h); S.P = Math.max(0, S.P + d[1] * h); S.C = Math.max(0, S.C + d[2] * h); if (S.N > 5000) S.N = 5000; }
    S.t += dt; S.hist.push([S.t, S.N, S.P, S.C]); if (S.hist.length > 600) S.hist.shift();
  }
  function reset(N, P, C) { S.N = N; S.P = P; S.C = C || 0; S.t = 0; S.hist = []; }
  function stages() {
    return [
      ['Levels of organisation', 'Levels', 'Individual, population, community and ecosystem',
        '<p>An <b>individual</b> is a single organism, such as a degu. The degus of one place form a <b>population</b> (same species, same place and time). The populations of different species living together —grasses, degus, culpeo foxes— form a <b>community</b>. The community together with the <b>abiotic</b> factors (water, light, temperature, soil) is an <b>ecosystem</b>, such as the scrubland of central Chile.</p>'],
      ['Exponential growth', 'Exponential', 'With unlimited resources the population multiplies: a J curve',
        '<p>If food and space are plentiful and there are no predators, each generation is larger than the last by the same proportion: growth is <b>exponential</b> (a J-shaped curve), dN/dt = r·N. No population can grow like this for long: resources run out. It happens when a new environment is colonised, like the European rabbit on arriving in Chile.</p>'],
      ['Carrying capacity', 'Capacity', 'Resources limit growth: the population levels off at K',
        '<p>As the population grows, food and space per individual decrease: births fall and deaths rise. These are <b>density-dependent factors</b>. The population grows in an <b>S</b> shape (<b>logistic</b> growth) and levels off at the <b>carrying capacity K</b>: the maximum the environment can sustain. Other factors, such as a frost or a fire, act regardless of density.</p>'],
      ['Predator and prey', 'Predation', 'Fox and degu populations oscillate out of step',
        '<p><b>Culpeo foxes</b> arrive. With plenty of prey, the predators feed well and breed; as they increase, they eat more degus and these decline; then, short of food, the foxes decline and the degus recover. The two populations <b>oscillate</b>, with the predator peak <b>after</b> the prey peak. Predation <b>regulates</b> both populations.</p>'],
      ['Competition and invasive species', 'Competition', 'Two species that use the same resource compete',
        '<p>The <b>European rabbit</b> is introduced; it eats the same grasses as the degu: there is <b>interspecific competition</b>. The rabbit, with no effective natural enemies in Chile, breeds faster and displaces the degu. <b>Invasive species</b> are one of the main causes of biodiversity loss. Other interactions are <b>mutualism</b> (both benefit, like bees and flowers) and <b>parasitism</b>.</p>'],
      ['Human impact', 'Humans', 'Habitat loss and hunting upset the balance of the ecosystem',
        '<p>Human activities change ecosystems: <b>habitat loss</b> (urban growth, fires, monocultures) reduces carrying capacity; <b>hunting</b> predators can trigger herbivore explosions; <b>pollution</b> and <b>climate change</b> affect births and deaths. Protected areas and the control of invasive species help conserve biodiversity.</p>']
    ];
  }
  function lessonSet(i, l, ctx, dt, f) {
    if (ctx._st !== i) {
      ctx._st = i; S.hunt = 0; S.hab = 0;
      if (i === 0) { S.pred = true; S.inv = false; S.logi = true; reset(300, 18, 0); }
      else if (i === 1) { S.pred = false; S.inv = false; S.logi = false; reset(10, 0, 0); }
      else if (i === 2) { S.pred = false; S.inv = false; S.logi = true; reset(10, 0, 0); }
      else if (i === 3) { S.pred = true; S.inv = false; S.logi = true; reset(250, 6, 0); }
      else if (i === 4) { S.pred = false; S.inv = true; S.logi = true; reset(380, 0, 4); }
      else { S.pred = true; S.inv = false; S.logi = true; reset(250, 20, 0); }
    }
    if (i === 5) { S.hab = l > 0.15 ? 0.5 : 0; S.hunt = l > 0.55 ? 0.6 : 0; }
    if (f.playing) step(dt * (i === 1 ? 0.9 : 2.2));
  }
  var def = {
    key: 'poblaciones-ecosistemas', title: 'Populations and ecosystems', subtitle: '3D simulator · biology', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 6, dur: 14, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-2, 12, 17], target: [-1.5, 0, 0] }, { id: 'sup', label: 'Top', pos: [-1.5, 24, 1], target: [-1.5, 0, 0] }],
    layers: [{ id: 'veg', label: 'Vegetation', icon: '✿' }],
    build: function (ctx) {
      var s = ctx.scene; dm = new T.Object3D();
      G.ground = new T.Mesh(new T.CylinderGeometry(R + 0.5, R + 0.5, 0.3, 48), new T.MeshStandardMaterial({ color: 0x8c7a4a, roughness: 1 })); G.ground.position.y = -0.15; s.add(G.ground);
      G.lost = new T.Mesh(new T.CylinderGeometry(R + 0.52, R + 0.52, 0.32, 48, 1, false, 0, Math.PI), new T.MeshStandardMaterial({ color: 0x868e96, roughness: 1 })); G.lost.position.y = -0.14; s.add(G.lost);
      var gg = new T.ConeGeometry(0.18, 0.6, 5); G.grass = new T.InstancedMesh(gg, new T.MeshStandardMaterial({ color: 0x51cf66 }), 260); for (var k = 0; k < 260; k++) { var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R; dm.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r); dm.scale.setScalar(0.7 + Math.random() * 0.8); dm.updateMatrix(); G.grass.setMatrixAt(k, dm.matrix); } s.add(G.grass);
      function herd(n, geo, col) { var m = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: col, roughness: 0.6 }), n); m.frustumCulled = false; m.userData.pos = []; for (var k = 0; k < n; k++) { var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (R - 0.5); m.userData.pos.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: Math.random() * 6.28, s: 0.5 + Math.random() }); } s.add(m); return m; }
      preyM = herd(160, new T.SphereGeometry(0.22, 10, 8), 0xb08155); predM = herd(40, new T.ConeGeometry(0.3, 0.8, 8), 0xe8590c); invM = herd(160, new T.SphereGeometry(0.24, 10, 8), 0xdee2e6);
      ['a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx, dt, f); else step(dt * 2.2);
      G.grass.visible = ctx.layer('veg'); G.lost.visible = S.hab > 0; G.lost.rotation.y = 0;
      var half = S.hab > 0;
      [[preyM, S.N / 3, 0.22], [predM, S.P, 0.4], [invM, S.C / 3, 0.24]].forEach(function (q) {
        var m = q[0], n = Math.min(m.count, Math.round(q[1]));
        for (var k = 0; k < m.count; k++) {
          var p = m.userData.pos[k];
          if (k < n) { p.h += (Math.random() - 0.5) * 0.4; p.x += Math.cos(p.h) * dt * p.s * 0.8; p.z += Math.sin(p.h) * dt * p.s * 0.8; var rr = Math.hypot(p.x, p.z); if (rr > R - 0.4 || (half && p.z > 0)) { p.h += Math.PI; p.x *= 0.97; p.z = half ? Math.min(p.z, -0.1) * 0.99 : p.z * 0.97; } dm.position.set(p.x, q[2], p.z); dm.rotation.set(0, -p.h, 0); dm.scale.setScalar(1); }
          else { dm.position.set(0, -20, 0); dm.scale.setScalar(0.001); }
          dm.updateMatrix(); m.setMatrixAt(k, dm.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      });
      lab.a.pos(-1.5, 3.4, 0).set('Degus ≈ ' + f0(S.N) + (S.pred ? ' · Foxes ≈ ' + f0(S.P) : '') + (S.inv ? ' · Rabbits ≈ ' + f0(S.C) : ''), 'bl-lead').vis(true);
      lab.b.pos(-1.5, 2.4, 0).set('t = ' + fmt(S.t, 1) + ' months · K = ' + f0(Keff()) + (S.logi ? '' : ' (no limit)'), 'bl-d').vis(true);
      lab.c.pos(0, 1.2, R * 0.55).set('Habitat lost', 'bl-warn').vis(half);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.r && u.r.set(S.r); u.K && u.K.set(S.K); } },
    hud: function () { return { eq: { chip: 'N', name: S.inv ? 'Competition' : S.pred ? 'Predator–prey' : (S.logi ? 'Logistic growth' : 'Exponential growth'), body: '<div class="eqline"><small>Exponential</small>dN/dt = r·N</div><div class="eqline"><small>Logistic</small>dN/dt = r·N·(1 − N/K)</div><div class="eqline"><small>Predation</small>− a·N·P</div>' }, legend: [{ label: 'Brown', color: '#b08155', text: 'degu (prey; each sphere ≈ 3 individuals)' }, { label: 'Orange', color: '#e8590c', text: 'culpeo fox (predator)' }, { label: 'White', color: '#dee2e6', text: 'European rabbit (invasive species)' }] }; },
    measures: function () { return [['Time', fmt(S.t, 1) + ' months'], ['Degus', f0(S.N)], ['Foxes', S.pred ? f0(S.P) : '—'], ['Rabbits (invasive)', S.inv ? f0(S.C) : '—'], ['Growth rate r', f2(S.r) + ' per month'], ['Carrying capacity', f0(Keff())], ['Habitat lost', f0(S.hab * 100) + ' %'], ['Fox hunting', S.hunt ? 'yes' : 'no']]; },
    ideas: ['Population: individuals of one species in one place; community: several populations.', 'Ecosystem = community + abiotic factors.', 'Exponential (J) with unlimited resources; logistic (S) with carrying capacity K.', 'Predator and prey oscillate out of step.', 'Competition: two species for the same resource; invasives displace natives.', 'Habitat loss and hunting upset the balance.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Population'); el.appendChild(c);
      ui.r = kit.ui.slider({ label: 'Growth rate r (per month)', min: 0.1, max: 1.5, step: 0.05, value: S.r, digits: 2, onInput: function (v) { ctx.goManual(); S.r = v; } });
      ui.K = kit.ui.slider({ label: 'Carrying capacity K', min: 100, max: 800, step: 20, value: S.K, digits: 0, onInput: function (v) { ctx.goManual(); S.K = v; } });
      ui.hab = kit.ui.slider({ label: 'Habitat loss (%)', min: 0, max: 80, step: 5, value: S.hab * 100, digits: 0, onInput: function (v) { ctx.goManual(); S.hab = v / 100; } });
      c.appendChild(kit.ui.sliders([ui.r, ui.K, ui.hab]));
      c.appendChild(ctx.btnRow([{ t: 'Resource limit on / off', fn: function () { ctx.goManual(); S.logi = !S.logi; } }, { t: 'Foxes on / off', fn: function () { ctx.goManual(); S.pred = !S.pred; if (S.pred && S.P < 1) S.P = 5; } }, { t: 'Invasive rabbits on / off', fn: function () { ctx.goManual(); S.inv = !S.inv; if (S.inv && S.C < 1) S.C = 4; } }, { t: 'Fox hunting on / off', fn: function () { ctx.goManual(); S.hunt = S.hunt ? 0 : 0.6; } }]));
      el.appendChild(ctx.btnRow([{ t: 'Reset', primary: true, fn: function () { ctx.goManual(); reset(20, S.pred ? 5 : 0, S.inv ? 4 : 0); } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Populations over time', h: 230, note: 'Brown: degus; orange: foxes (×10 to make them visible); grey: rabbits. Dashed line: carrying capacity.', draw: function (cx, w, h, col) {
        var L = 44, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, H = S.hist, t0 = H.length ? H[0][0] : 0, t1 = Math.max(t0 + 10, H.length ? H[H.length - 1][0] : 10), ym = Math.max(S.K * 1.15, 100); H.forEach(function (q) { ym = Math.max(ym, q[1], q[3], q[2] * 10); }); ym = Math.min(ym, 3000);
        var sx = function (t) { return L + pw * (t - t0) / (t1 - t0); }, sy = function (v) { return Tp + ph - ph * Math.min(v, ym) / ym; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(ym * i / 4)); cx.lineTo(L + pw, sy(ym * i / 4)); cx.stroke(); cx.fillText(fmt(ym * i / 4, 0), L - 5, sy(ym * i / 4) + 3); }
        cx.textAlign = 'center'; cx.fillText('time (months)  ·  individuals', L + pw / 2, h - 3); cx.fillText(fmt(t0, 0), L, h - B + 13); cx.fillText(fmt(t1, 0), L + pw, h - B + 13);
        if (S.logi) { cx.strokeStyle = col.muted; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(L, sy(Keff())); cx.lineTo(L + pw, sy(Keff())); cx.stroke(); cx.setLineDash([]); }
        [[1, '#b08155', 1], [2, '#e8590c', 10], [3, '#adb5bd', 1]].forEach(function (c) { if (c[0] === 2 && !S.pred) return; if (c[0] === 3 && !S.inv) return; cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); H.forEach(function (q, k) { var y = sy(q[c[0]] * c[2]); if (k) cx.lineTo(sx(q[0]), y); else cx.moveTo(sx(q[0]), y); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Predator–prey cycle', h: 210, note: 'Each point is an instant (degus, foxes). The oscillations form a closed orbit.', draw: function (cx, w, h, col) {
        var L = 44, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, xm = Math.max(100, S.K), ym = 60, sx = function (n) { return L + pw * Math.min(n, xm) / xm; }, sy = function (p) { return Tp + ph - ph * Math.min(p, ym) / ym; };
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('degus  ·  foxes', L + pw / 2, h - 3); cx.strokeStyle = col.line; cx.strokeRect(L, Tp, pw, ph);
        if (!S.pred) { cx.fillText('Turn on the foxes to see the cycle', L + pw / 2, Tp + ph / 2); return; }
        cx.strokeStyle = '#e8590c'; cx.lineWidth = 1.8; cx.beginPath(); S.hist.forEach(function (q, k) { if (k) cx.lineTo(sx(q[1]), sy(q[2])); else cx.moveTo(sx(q[1]), sy(q[2])); }); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, d = deriv(S.N, S.P, S.C);
      return '<div class="card-kicker">Dynamics at t = ' + fmt(S.t, 1) + ' months</div><table class="calc-table">' + row('Degu growth', S.logi ? 'r·N·(1 − N/K) = ' + f2(S.r) + '·' + f0(S.N) + '·(1 − ' + f0(S.N) + '/' + f0(Keff()) + ')' : 'r·N = ' + f2(S.r) + '·' + f0(S.N)) + row('Total dN/dt', '<b>' + fmt(d[0], 1) + ' per month</b>') + row('Doubling (exponential)', 't = ln2/r = <b>' + fmt(Math.LN2 / S.r, 2) + ' months</b>') + (S.pred ? row('dP/dt (foxes)', '<b>' + fmt(d[1], 2) + ' per month</b>') : '') + row('Interpretation', Math.abs(d[0]) < 1 ? 'the population is near equilibrium' : d[0] > 0 ? 'the population is growing' : 'the population is declining') + '</table>';
    },
    quiz: [
      { q: 'All the degus living on a hill form…', options: ['a population', 'a community', 'an ecosystem', 'an individual'], answer: 0, why: 'Same species, same place and time.' },
      { q: 'An ecosystem is made up of…', options: ['the community and the abiotic factors', 'only the animals', 'only the plants', 'a single species'], answer: 0, why: 'Biotic + abiotic.' },
      { q: 'Exponential growth happens when…', options: ['resources are plentiful and nothing limits growth', 'the population has reached K', 'there are many predators', 'there is strong competition'], answer: 0, why: 'J curve.' },
      { q: 'Carrying capacity is…', options: ['the maximum number of individuals the environment can sustain', 'the maximum birth rate', 'the weight of the individuals', 'the number of predators'], answer: 0, why: 'Set by food, space, water…' },
      { q: 'In a predator–prey cycle, the predator peak comes…', options: ['after the prey peak', 'before the prey peak', 'at the same time', 'never'], answer: 0, why: 'First the prey become abundant, then the predators that eat them.' },
      { q: 'The European rabbit in Chile is an example of…', options: ['an invasive species', 'mutualism', 'an endemic species', 'a top predator'], answer: 0, why: 'Introduced and without natural control, it displaces native species.' },
      { q: 'If all the foxes in an area are hunted, the degus will most likely…', options: ['increase until the food runs out', 'disappear', 'not change', 'all migrate'], answer: 0, why: 'Without predation they grow to the carrying capacity or beyond.' },
      { q: 'A density-dependent factor is…', options: ['food shortage', 'a frost', 'a volcanic eruption', 'a fire'], answer: 0, why: 'It has more effect the denser the population.' }
    ],
    help: { intro: 'In «Lab» change the growth rate and carrying capacity, add predators or an invasive species, and simulate habitat loss or hunting.', items: [['Brown spheres', 'degus (each sphere ≈ 3 individuals).'], ['Orange cones', 'culpeo foxes; white spheres: European rabbits.'], ['Graphs', 'populations over time and the predator–prey cycle.']], try: ['Remove the resource limit: what shape is the curve?', 'Add foxes: which one peaks first?', 'Introduce rabbits: what happens to the degu?'] }
  };
  MSim.create(def);
})();
