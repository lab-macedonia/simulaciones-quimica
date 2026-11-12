/* Epidemias, sistema inmune y vacunas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f0 = function (x) { return fmt(x, 0); }, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var NA = 300, A = [], inst, dm, tmpC, G = {}, lab = {}, W = 9;
  var S = { R0: 3, D: 7, vac: 0, eff: 0.9, dist: 0, day: 0, s: 0, i: 0, r: 0, v: 0, hist: [], run: true };
  var COL = [0x4dabf7, 0xff6b6b, 0x51cf66, 0xfcc419];
  function Reff() { return S.R0 * (1 - S.dist * 0.6); }
  function reset() {
    S.day = 0; S.hist = []; S.v = Math.round(NA * S.vac * S.eff); S.i = 3; S.r = 0; S.s = NA - S.v - S.i;
    A.forEach(function (a, k) { a.st = 0; a.t = 0; }); var idx = A.map(function (a, k) { return k; }).sort(function () { return Math.random() - 0.5; });
    for (var k = 0; k < S.v; k++) A[idx[k]].st = 3; for (k = S.v; k < S.v + 3; k++) A[idx[k]].st = 1;
  }
  function stepODE(dt) {
    var g = 1 / S.D, b = Reff() * g, n = 40, h = dt / n, s = S.s, i = S.i, r = S.r;
    for (var k = 0; k < n; k++) { var inf = b * s * i / NA * h, rec = g * i * h; s -= inf; i += inf - rec; r += rec; }
    S.s = Math.max(0, s); S.i = Math.max(0, i); S.r = r; S.day += dt;
    S.hist.push([S.day, S.s, S.i, S.r, S.v]); if (S.hist.length > 800) S.hist.shift();
    // ajustar los agentes a los números del modelo: contagia a vecinos de infectados y recupera a los más antiguos
    var I = A.filter(function (a) { return a.st === 1; }), R = A.filter(function (a) { return a.st === 2; }), need = Math.round(S.r) - R.length;
    I.sort(function (a, b2) { return b2.t - a.t; }); for (k = 0; k < need && k < I.length; k++) I[k].st = 2;
    I = A.filter(function (a) { return a.st === 1; }); var add = Math.round(S.i) - I.length;
    for (k = 0; k < add; k++) { var best = null, bd = 1e9, src = I.length ? I[Math.floor(Math.random() * I.length)] : null; A.forEach(function (a) { if (a.st !== 0) return; var d = src ? Math.hypot(a.x - src.x, a.z - src.z) + Math.random() * 1.5 : Math.random(); if (d < bd) { bd = d; best = a; } }); if (!best) break; best.st = 1; best.t = 0; }
    A.forEach(function (a) { if (a.st === 1) a.t += dt; });
  }
  function finalSize(cov) { var g = 1 / S.D, b = Reff() * g, s = NA * (1 - cov * S.eff) - 1, i = 1, r = 0; for (var k = 0; k < 4000; k++) { var h = 0.25, inf = b * s * i / NA * h, rec = g * i * h; s -= inf; i += inf - rec; r += rec; if (i < 0.01) break; } return (r + i) / NA; }
  function stages() {
    return [
      ['Infectious agents and transmission', 'Transmission', 'Viruses and bacteria pass from person to person by contact, droplets or aerosols',
        '<p>Infectious diseases are caused by <b>pathogens</b>: viruses, bacteria, fungi or parasites. They are <b>transmitted</b> by direct contact, droplets and aerosols when coughing or talking, surfaces, contaminated water or food, or vectors such as mosquitoes. Here, each figure is a person: blue = susceptible, red = infected.</p>'],
      ['The epidemic curve', 'Epidemic', 'Cases rise, peak and fall: the SIR model',
        '<p>At first almost everyone is <b>susceptible</b> (S) and cases grow fast. The <b>infected</b> (I) are contagious for a few days and then <b>recover</b> (R) with immunity. As fewer susceptibles remain, each sick person infects fewer people: the curve reaches a <b>peak</b> and falls. This is the <b>SIR</b> model, used in public health.</p>'],
      ['Reproduction number R₀', 'R₀', 'How many people each infected person infects, on average',
        '<p><b>R₀</b> is the number of people each infected person infects, on average, in a population with no immunity: ≈ 1–2 for flu, ≈ 3–6 for the original SARS-CoV-2 and ≈ 12–18 for measles. If the effective number <b>R &gt; 1</b>, cases rise; if <b>R &lt; 1</b>, they fall. Ventilation, masks and fewer contacts lower R.</p>'],
      ['The immune system', 'Immunity', 'Barriers, the innate response and the adaptive response with memory',
        '<p>The body defends itself in layers: <b>barriers</b> (skin, mucous membranes, tears, stomach acid); the <b>innate response</b>, fast and non-specific (inflammation, fever, phagocytes); and the <b>adaptive response</b>, specific, with <b>B lymphocytes</b> that make <b>antibodies</b> and <b>T lymphocytes</b>. The latter creates <b>memory</b>: on a second infection it responds faster and more strongly. That is why the recovered (green) are not reinfected in this simulation.</p>'],
      ['Vaccines', 'Vaccines', 'They create immune memory without going through the disease',
        '<p>A <b>vaccine</b> shows the immune system an antigen from the pathogen (inactivated, weakened, a protein or its mRNA) so that it makes <b>antibodies and memory</b> without getting ill. Vaccinated people (yellow) are protected in ≈ 90 % of cases. Vaccines have eradicated smallpox and nearly eliminated polio and measles in many countries.</p>'],
      ['Herd immunity', 'Herd', 'With enough immune people, the pathogen finds no one to infect',
        '<p>If a large enough share of the population is immune, each infected person meets few susceptibles and R drops below 1: the epidemic does not take off and those who <b>cannot be vaccinated</b> (newborns, the immunocompromised) are protected too. The threshold is <b>1 − 1/R₀</b>: ≈ 67 % for R₀ = 3 and ≈ 93 % for measles. Compare the size of the epidemic by coverage in the graph.</p>']
    ];
  }
  function lessonSet(i, l, ctx, dt, f) {
    if (ctx._st !== i) { ctx._st = i; S.dist = 0; S.vac = i === 4 ? 0.4 : i === 5 ? 0.75 : 0; S.R0 = 3; reset(); }
    if (i === 2) S.dist = l > 0.4 ? 0.6 : 0;
    if (f.playing && S.day < 120) stepODE(dt * (i === 0 ? 1.2 : 4));
  }
  var def = {
    key: 'epidemias-vacunas', title: 'Epidemics, the immune system and vaccines', subtitle: '3D simulator · biology and health', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 6, dur: 14, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-2, 13, 15], target: [-1.5, 0, 0] }, { id: 'sup', label: 'Top', pos: [-1.5, 22, 1], target: [-1.5, 0, 0] }],
    layers: [{ id: 'halo', label: 'Contagion zone', icon: '◌' }],
    build: function (ctx) {
      var s = ctx.scene; tmpC = new T.Color(); dm = new T.Object3D();
      var floor = new T.Mesh(new T.BoxGeometry(2 * W + 1, 0.2, 2 * W + 1), new T.MeshStandardMaterial({ color: 0xced4da, roughness: 0.9 })); floor.position.y = -0.1; s.add(floor);
      inst = new T.InstancedMesh((T.CapsuleGeometry ? new T.CapsuleGeometry(0.16, 0.3, 4, 8) : new T.SphereGeometry(0.22, 10, 8)), new T.MeshStandardMaterial({ roughness: 0.5 }), NA); inst.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NA * 3), 3); inst.frustumCulled = false; s.add(inst);
      G.halo = new T.InstancedMesh(new T.RingGeometry(0.45, 0.55, 20), new T.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.5, side: T.DoubleSide }), NA); G.halo.frustumCulled = false; s.add(G.halo);
      for (var k = 0; k < NA; k++) A.push({ x: (Math.random() * 2 - 1) * W, z: (Math.random() * 2 - 1) * W, h: Math.random() * 6.28, st: 0, t: 0 });
      reset(); ['a', 'b', 'c'].forEach(function (k2) { lab[k2] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx, dt, f); else if (S.run && S.day < 150) stepODE(dt * 4);
      var sp = 1.6 * (1 - S.dist * 0.8), hal = ctx.layer('halo'), nh = 0;
      A.forEach(function (a, k) {
        a.h += (Math.random() - 0.5) * 0.5; a.x += Math.cos(a.h) * sp * dt; a.z += Math.sin(a.h) * sp * dt;
        if (Math.abs(a.x) > W) { a.x = Math.sign(a.x) * W; a.h = Math.PI - a.h; } if (Math.abs(a.z) > W) { a.z = Math.sign(a.z) * W; a.h = -a.h; }
        dm.position.set(a.x, 0.32, a.z); dm.rotation.set(0, 0, 0); dm.scale.setScalar(1); dm.updateMatrix(); inst.setMatrixAt(k, dm.matrix); tmpC.setHex(COL[a.st]); inst.setColorAt(k, tmpC);
        if (hal && a.st === 1) { dm.position.set(a.x, 0.02, a.z); dm.rotation.set(-Math.PI / 2, 0, 0); dm.scale.setScalar(1 + 0.25 * Math.sin(ctx.now * 4 + k)); dm.updateMatrix(); G.halo.setMatrixAt(nh++, dm.matrix); }
      });
      G.halo.count = nh; G.halo.instanceMatrix.needsUpdate = true; inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
      var Rt = Reff() * S.s / NA;
      lab.a.pos(-1.5, 3, -W).set('Day ' + f0(S.day) + ' · S ' + f0(S.s) + ' · I ' + f0(S.i) + ' · R ' + f0(S.r) + (S.v ? ' · V ' + f0(S.v) : ''), 'bl-lead').vis(true);
      lab.b.pos(-1.5, 2, -W).set('R₀ = ' + f1(S.R0) + ' · effective R = ' + f2(Rt) + (Rt < 1 ? ' (< 1: cases fall)' : ' (> 1: cases rise)'), Rt < 1 ? 'bl-neg' : 'bl-warn').vis(true);
      lab.c.pos(-1.5, 1, -W).set('Vaccinated ' + f0(S.vac * 100) + ' % · herd threshold 1 − 1/R₀ = ' + f0(Math.max(0, 1 - 1 / Reff()) * 100) + ' %', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.R0 && u.R0.set(S.R0); u.vac && u.vac.set(S.vac * 100); u.dist && u.dist.set(S.dist * 100); } },
    hud: function () { return { eq: { chip: 'R₀', name: 'SIR model', body: '<div class="eqline"><small>Infections</small>β·S·I/N</div><div class="eqline"><small>Recovery</small>γ·I (γ = 1/duration)</div><div class="eqline"><small>Herd threshold</small>1 − 1/R₀</div>' }, legend: [{ label: 'Blue', color: '#4dabf7', text: 'susceptible' }, { label: 'Red', color: '#ff6b6b', text: 'infected' }, { label: 'Green', color: '#51cf66', text: 'recovered (immune)' }, { label: 'Yellow', color: '#fcc419', text: 'vaccinated (immune)' }] }; },
    measures: function () { var peak = 0, pd = 0; S.hist.forEach(function (q) { if (q[2] > peak) { peak = q[2]; pd = q[0]; } }); return [['Day', f0(S.day)], ['Susceptible', f0(S.s)], ['Infected', f0(S.i)], ['Recovered', f0(S.r)], ['Immune vaccinated', f0(S.v)], ['R₀ · effective R', f1(S.R0) + ' · ' + f2(Reff() * S.s / NA)], ['Peak infected', f0(peak) + ' (day ' + f0(pd) + ')'], ['Herd immunity threshold', f0(Math.max(0, 1 - 1 / Reff()) * 100) + ' %']]; },
    ideas: ['Pathogens: viruses, bacteria, fungi and parasites.', 'SIR: susceptible → infected → recovered.', 'R > 1: cases grow; R < 1: they decline.', 'Adaptive immunity: antibodies and memory.', 'Vaccine: memory without disease.', 'Herd threshold: 1 − 1/R₀.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Disease and population'); el.appendChild(c);
      ui.R0 = kit.ui.slider({ label: 'R₀ (infections per case)', min: 0.8, max: 15, step: 0.1, value: S.R0, digits: 1, onInput: function (v) { ctx.goManual(); S.R0 = v; } });
      ui.D = kit.ui.slider({ label: 'Infectious days', min: 3, max: 14, step: 1, value: S.D, digits: 0, onInput: function (v) { ctx.goManual(); S.D = v; } });
      ui.vac = kit.ui.slider({ label: 'Vaccination coverage (%)', min: 0, max: 98, step: 1, value: S.vac * 100, digits: 0, onInput: function (v) { ctx.goManual(); S.vac = v / 100; } });
      ui.dist = kit.ui.slider({ label: 'Prevention measures (% reduction in contacts)', min: 0, max: 80, step: 5, value: S.dist * 100, digits: 0, onInput: function (v) { ctx.goManual(); S.dist = v / 100; } });
      c.appendChild(kit.ui.sliders([ui.R0, ui.D, ui.vac, ui.dist]));
      el.appendChild(ctx.btnRow([{ t: 'New epidemic', primary: true, fn: function () { ctx.goManual(); reset(); } }, { t: 'Pause / resume', fn: function () { ctx.goManual(); S.run = !S.run; } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'S, I and R curves', h: 230, note: 'Blue: susceptible; red: infected; green: recovered; yellow: vaccinated.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, tm = Math.max(60, S.day), sx = function (t) { return L + pw * t / tm; }, sy = function (v) { return Tp + ph - ph * v / NA; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(NA * i / 4)); cx.lineTo(L + pw, sy(NA * i / 4)); cx.stroke(); cx.fillText(f0(NA * i / 4), L - 5, sy(NA * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= tm; i += 20) cx.fillText(i, sx(i), h - B + 13); cx.fillText('days  ·  people', L + pw / 2, h - 3);
        [[1, '#4dabf7'], [2, '#ff6b6b'], [3, '#51cf66'], [4, '#fcc419']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); S.hist.forEach(function (q, k) { if (k) cx.lineTo(sx(q[0]), sy(q[c[0]])); else cx.moveTo(sx(q[0]), sy(q[c[0]])); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Epidemic size by coverage', h: 200, note: 'Share of the population that ends up infected. Above the threshold 1 − 1/R₀ (dashed line), the epidemic barely happens.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, sx = function (c) { return L + pw * c; }, sy = function (v) { return Tp + ph - ph * v; }, i;
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(i * 10 + ' %', sx(i / 10), h - B + 13); cx.fillText('vaccination coverage  ·  % of the population infected', L + pw / 2, h - 3);
        cx.textAlign = 'right'; [0, 0.5, 1].forEach(function (v) { cx.fillText(f0(v * 100), L - 4, sy(v) + 3); });
        var th = Math.max(0, 1 - 1 / Reff()) / S.eff; cx.strokeStyle = col.muted; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(sx(Math.min(1, th)), Tp); cx.lineTo(sx(Math.min(1, th)), Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#c92a2a'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 40; i++) { var c = i / 40, v = finalSize(c); if (i) cx.lineTo(sx(c), sy(v)); else cx.moveTo(sx(c), sy(v)); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#1864ab'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.vac), sy(finalSize(S.vac)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, Re = Reff();
      return '<div class="card-kicker">SIR model · ' + NA + ' people</div><table class="calc-table">' + row('γ = 1/duration', '1/' + f0(S.D) + ' = <b>' + fmt(1 / S.D, 3) + ' per day</b>') + row('β = R·γ', f2(Re) + '·' + fmt(1 / S.D, 3) + ' = <b>' + fmt(Re / S.D, 3) + ' per day</b>') + row('Effective R today', 'R·S/N = ' + f2(Re) + '·' + f0(S.s) + '/' + NA + ' = <b>' + f2(Re * S.s / NA) + '</b>') + row('Herd threshold', '1 − 1/' + f2(Re) + ' = <b>' + f0(Math.max(0, 1 - 1 / Re) * 100) + ' %</b> immune') + row('Coverage needed (efficacy ' + f0(S.eff * 100) + ' %)', '<b>' + (Re > 1 ? f0(Math.min(1, (1 - 1 / Re) / S.eff) * 100) + ' %' : '0 %') + '</b>') + '</table>';
    },
    quiz: [
      { q: 'An example of a defensive barrier of the body is…', options: ['the skin', 'antibodies', 'vaccines', 'B lymphocytes'], answer: 0, why: 'Barriers stop pathogens getting in.' },
      { q: 'Immune memory is provided by…', options: ['the lymphocytes of the adaptive response', 'the skin', 'fever', 'stomach acid'], answer: 0, why: 'Memory B and T lymphocytes.' },
      { q: 'A vaccine works because it…', options: ['creates antibodies and memory without causing the disease', 'directly kills all viruses', 'is an antibiotic', 'replaces white blood cells'], answer: 0, why: 'It presents antigens to the immune system.' },
      { q: 'If the effective R is less than 1…', options: ['cases decrease', 'cases increase', 'the epidemic doubles', 'nothing changes'], answer: 0, why: 'Each infected person infects, on average, fewer than one person.' },
      { q: 'With R₀ = 4, the herd immunity threshold is…', options: ['75 %', '25 %', '40 %', '100 %'], answer: 0, why: '1 − 1/4 = 0.75.' },
      { q: 'Herd immunity especially protects…', options: ['those who cannot be vaccinated', 'only the vaccinated', 'the viruses', 'nobody'], answer: 0, why: 'The pathogen cannot find chains of transmission.' },
      { q: 'Ventilating and wearing masks helps because it…', options: ['reduces infections and lowers R', 'increases R₀', 'cures the disease', 'replaces the vaccine'], answer: 0, why: 'Less transmission per contact.' },
      { q: 'Antibiotics work against…', options: ['bacteria', 'viruses', 'all pathogens', 'allergies'], answer: 0, why: 'They do not act on viruses.' }
    ],
    help: { intro: 'Each figure is a person. In «Lab» change R₀, the infectious period, vaccination coverage and prevention measures; «New epidemic» starts with 3 cases.', items: [['Colours', 'blue susceptible, red infected, green recovered, yellow vaccinated.'], ['Graphs', 'SIR curves and final epidemic size by coverage.'], ['Calculation', 'effective R and the coverage needed for herd immunity.']], try: ['With R₀ = 3, what coverage prevents the epidemic?', 'Try R₀ = 15 (measles): what coverage is needed?', 'Without vaccines, raise the prevention measures: what happens to the peak?'] }
  };
  MSim.create(def);
})();
