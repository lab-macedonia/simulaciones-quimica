/* Microorganismos y biotecnología — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var S = { mode: 'zoo', T: 37, abx: false, dose: 1, t: 0, ns: 1e3, nr: 1, hist: [], vt: 0, ft: 0, glu: 100, eth: 0, co2: 0, fhist: [] };
  var G = {}, lab = {}, bact, dm, tmpC, NB = 400, bpos = [], viruses = [], bubbles = [], yeasts = [], K = 1e9;
  function rate() { var d = S.T - 37; return S.T < 4 || S.T > 50 ? 0 : 1.4 * Math.exp(-d * d / 120); }   // por hora
  function stepCult(dt) {
    var h = dt / 10;
    for (var k = 0; k < 10; k++) { var r = rate(), lag = clamp(S.t / 1.5, 0, 1), N = S.ns + S.nr, g = 1 - N / K, kill = S.abx ? 2.2 * S.dose : 0;
      S.ns = Math.max(0, S.ns + (r * lag * S.ns * g - kill * S.ns - (g < 0.02 ? 0.05 * S.ns : 0)) * h); S.nr = Math.max(0, S.nr + (0.9 * r * lag * S.nr * g + 1e-4 * r * S.ns * g - (g < 0.02 ? 0.05 * S.nr : 0)) * h); S.t += h; }
    S.hist.push([S.t, S.ns, S.nr]); if (S.hist.length > 700) S.hist.shift();
  }
  function stepFerm(dt) { var r = rate() * 0.25, use = Math.min(S.glu, r * S.glu * 0.15 * dt + (S.glu > 0 ? 0.6 * r * dt : 0)); S.glu -= use; S.eth += use * 0.51; S.co2 += use * 0.49; S.ft += dt; S.fhist.push([S.ft, S.glu, S.eth, S.co2]); if (S.fhist.length > 700) S.fhist.shift(); }
  function resetCult() { S.t = 0; S.ns = 1e3; S.nr = 1; S.hist = []; }
  function resetFerm() { S.ft = 0; S.glu = 100; S.eth = 0; S.co2 = 0; S.fhist = []; }
  function stages() {
    return [
      ['Three types of microorganism', 'Microbes', 'Bacteria, microscopic fungi and viruses: very different sizes',
        '<p><b>Microorganisms</b> can only be seen with a microscope. <b>Bacteria</b> (≈ 1–5 μm) are <b>prokaryotic</b> cells, with no nucleus. Microscopic <b>fungi</b>, such as <b>yeasts</b> (≈ 5–10 μm), are <b>eukaryotic</b> cells. <b>Viruses</b> (≈ 0.02–0.3 μm) <b>are not cells</b>: they are genetic material inside a protein coat. Here they are enlarged at different scales.</p>'],
      ['Bacteria and their growth', 'Bacteria', 'They reproduce by binary fission: lag, exponential, stationary and death phases',
        '<p>A bacterium has a <b>cell wall</b>, membrane, cytoplasm with ribosomes, a circular chromosome (<b>nucleoid</b>), sometimes <b>plasmids</b> and <b>flagella</b>. It reproduces by <b>binary fission</b>: at 37 °C, some double every 20–30 min. A culture shows a <b>lag</b> phase, an <b>exponential</b> phase, a <b>stationary</b> phase (nutrients run out) and a <b>death</b> phase. Temperature changes how fast they grow.</p>'],
      ['Viruses: parasites of cells', 'Viruses', 'They only multiply inside a host cell',
        '<p>A <b>virus</b> does not feed, grow or reproduce on its own: it is an <b>obligate parasite</b>. It binds to a cell, injects its genetic material and forces the cell to build new viruses, which burst out and destroy it (the <b>lytic cycle</b>). Viruses cause diseases such as flu, measles or COVID-19. Antibiotics do <b>not</b> work against them; vaccines and some antivirals do.</p>'],
      ['Fungi: yeasts and moulds', 'Fungi', 'Single-celled like yeast or with hyphae like moulds',
        '<p><b>Fungi</b> are eukaryotes that feed by absorbing organic matter: they are major <b>decomposers</b>. <b>Yeasts</b> are single-celled and reproduce by <b>budding</b> (a daughter cell sprouts). <b>Moulds</b> form filaments called <b>hyphae</b>. Some cause disease (athlete’s foot); others make foods and medicines, such as <b>penicillin</b>.</p>'],
      ['Antibiotics and resistance', 'Resistance', 'The antibiotic kills sensitive bacteria; resistant ones survive and multiply',
        '<p><b>Antibiotics</b> kill bacteria or stop them growing. A population contains, by chance, a few <b>resistant</b> bacteria (orange). When the antibiotic is applied, the sensitive ones die and the resistant ones multiply: the culture becomes resistant. That is why antibiotics should be used <b>only on prescription</b>, the course completed, and <b>never</b> against viruses.</p>'],
      ['Biotechnology', 'Biotechnology', 'We use microorganisms to make foods, medicines and metals',
        '<p><b>Biotechnology</b> puts microorganisms to work: yeast <b>ferments</b> glucose into <b>ethanol and CO₂</b> (the CO₂ makes bread rise; the ethanol, wine); lactic bacteria turn lactose into lactic acid (<b>yoghurt</b>, cheeses); fungi and bacteria produce <b>antibiotics</b> and <b>insulin</b>. In Chile, <b>biomining</b> uses bacteria such as <i>Acidithiobacillus</i> to release <b>copper</b> from ores.</p>']
    ];
  }
  function lessonSet(i, l, ctx, dt, f) {
    if (ctx._st !== i) { ctx._st = i; S.abx = false; S.T = 37; resetCult(); resetFerm(); S.vt = 0; }
    S.mode = ['zoo', 'cultivo', 'virus', 'hongo', 'cultivo', 'ferm'][i];
    if (i === 4) { if (S.t > 6 && !S.abx) { S.abx = true; } }
    if (f.playing) { if (S.mode === 'cultivo') stepCult(dt * (i === 4 ? 1.2 : 1.6)); if (S.mode === 'ferm') stepFerm(dt * 2.5); S.vt += dt; }
  }
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5 }, o || {})); }
  function makeBact() { var g = new T.Group(), body = new T.Mesh(T.CapsuleGeometry ? new T.CapsuleGeometry(0.6, 1.6, 8, 16) : new T.CylinderGeometry(0.6, 0.6, 2.2, 16), mat(0x8ce99a, { transparent: true, opacity: 0.55 })); body.rotation.z = Math.PI / 2; g.add(body); var dna = new T.Mesh(new T.TorusKnotGeometry(0.28, 0.04, 80, 6, 2, 3), mat(0x845ef7)); g.add(dna); var pl = new T.Mesh(new T.TorusGeometry(0.12, 0.03, 6, 20), mat(0xf783ac)); pl.position.set(0.7, 0.2, 0.1); g.add(pl); for (var k = 0; k < 14; k++) { var rb = new T.Mesh(new T.SphereGeometry(0.05, 6, 4), mat(0x1c7ed6)); rb.position.set((Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7); g.add(rb); } var fl = new T.Mesh(new T.TorusGeometry(0.5, 0.03, 6, 30, Math.PI * 1.6), mat(0x868e96)); fl.position.set(-1.6, 0, 0); fl.rotation.z = 1.2; g.add(fl); return g; }
  function makeVirus(s) { var g = new T.Group(), cap = new T.Mesh(new T.IcosahedronGeometry(0.4 * s, 0), mat(0xff8787, { flatShading: true })); g.add(cap); for (var k = 0; k < 12; k++) { var sp = new T.Mesh(new T.CylinderGeometry(0.02 * s, 0.02 * s, 0.25 * s, 4), mat(0xffd43b)); var d = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); sp.position.copy(d.clone().multiplyScalar(0.48 * s)); sp.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); g.add(sp); } return g; }
  function makeYeast(r) { var g = new T.Group(), c = new T.Mesh(new T.SphereGeometry(r, 20, 14), mat(0xffe8a1, { transparent: true, opacity: 0.8 })); c.scale.set(1.15, 1, 1); g.add(c); var n = new T.Mesh(new T.SphereGeometry(r * 0.35, 12, 8), mat(0xae3ec9)); g.add(n); g.userData.bud = new T.Mesh(new T.SphereGeometry(r * 0.5, 14, 10), mat(0xffe8a1, { transparent: true, opacity: 0.8 })); g.userData.bud.position.set(r * 1.2, r * 0.5, 0); g.add(g.userData.bud); return g; }
  var def = {
    key: 'microorganismos', title: 'Microorganisms and biotechnology', subtitle: '3D simulator · biology', accent: { dark: '#63e6be', light: '#087f5b' },
    stages: stages, nStages: 6, dur: 14, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-1.5, 4, 12], target: [-1.2, 1, 0] }, { id: 'sup', label: 'Top', pos: [-1.2, 14, 1], target: [-1.2, 0, 0] }],
    layers: [{ id: 'scale', label: 'Scale', icon: '↔' }],
    build: function (ctx) {
      var s = ctx.scene; dm = new T.Object3D(); tmpC = new T.Color();
      G.zoo = new T.Group(); s.add(G.zoo); var b = makeBact(); b.position.set(0.9, 1.2, 0); G.zoo.add(b); G.zB = b; var y = makeYeast(1.2); y.position.set(4.4, 1.3, 0); G.zoo.add(y); G.zY = y; var v = makeVirus(1); v.position.set(-1.8, 1.2, 0); G.zoo.add(v); G.zV = v;
      G.cult = new T.Group(); s.add(G.cult); var dish = new T.Mesh(new T.CylinderGeometry(4.5, 4.5, 0.4, 48, 1, true), mat(0xdee2e6, { transparent: true, opacity: 0.35, side: T.DoubleSide })); dish.position.y = 0.2; G.cult.add(dish); var agar = new T.Mesh(new T.CylinderGeometry(4.4, 4.4, 0.15, 48), mat(0xffe066, { transparent: true, opacity: 0.6 })); agar.position.y = 0.08; G.cult.add(agar);
      bact = new T.InstancedMesh(T.CapsuleGeometry ? new T.CapsuleGeometry(0.06, 0.16, 4, 6) : new T.CylinderGeometry(0.06, 0.06, 0.28, 6), mat(0xffffff), NB); bact.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NB * 3), 3); bact.frustumCulled = false; G.cult.add(bact);
      for (var k = 0; k < NB; k++) { var a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 4.1; bpos.push([Math.cos(a) * r, Math.sin(a) * r, Math.random() * 3]); }
      G.vir = new T.Group(); s.add(G.vir); G.host = makeBact(); G.host.scale.setScalar(1.4); G.host.position.set(0, 1, 0); G.vir.add(G.host); for (k = 0; k < 10; k++) { var vv = makeVirus(0.45); G.vir.add(vv); viruses.push(vv); }
      G.fun = new T.Group(); s.add(G.fun); for (k = 0; k < 5; k++) { var ye = makeYeast(0.5); ye.position.set(-3 + k * 1.3, 1 + (k % 2) * 0.6, 0); G.fun.add(ye); yeasts.push(ye); }
      G.hyph = new T.Group(); for (k = 0; k < 9; k++) { var hy = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.6, 6), mat(0xced4da)); hy.position.set(2.8 + Math.cos(k) * 0.8, 0.8 + (k % 3) * 0.5, Math.sin(k) * 0.8); hy.rotation.z = k * 0.7; G.hyph.add(hy); } G.fun.add(G.hyph);
      G.ferm = new T.Group(); s.add(G.ferm); var fl = new T.Mesh(new T.CylinderGeometry(1.4, 2, 3.2, 32, 1, true), mat(0xe7f5ff, { transparent: true, opacity: 0.3, side: T.DoubleSide })); fl.position.y = 1.6; G.ferm.add(fl); G.liq = new T.Mesh(new T.CylinderGeometry(1.6, 1.95, 2, 32), mat(0xffd8a8, { transparent: true, opacity: 0.7 })); G.liq.position.y = 1; G.ferm.add(G.liq);
      for (k = 0; k < 40; k++) { var bb = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), mat(0xffffff, { transparent: true, opacity: 0.8 })); bb.userData = { x: (Math.random() - 0.5) * 2.4, z: (Math.random() - 0.5) * 2.4, y: Math.random() * 2, s: 0.5 + Math.random() }; G.ferm.add(bb); bubbles.push(bb); }
      G.ballon = new T.Mesh(new T.SphereGeometry(0.6, 20, 14), mat(0xff6b6b, { transparent: true, opacity: 0.85 })); G.ballon.position.y = 3.8; G.ferm.add(G.ballon);
      ['a', 'b', 'c', 'd'].forEach(function (k2) { lab[k2] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx, dt, f); else { if (S.mode === 'cultivo') stepCult(dt * 1.6); if (S.mode === 'ferm') stepFerm(dt * 2.5); S.vt += dt; }
      G.zoo.visible = S.mode === 'zoo'; G.cult.visible = S.mode === 'cultivo'; G.vir.visible = S.mode === 'virus'; G.fun.visible = S.mode === 'hongo'; G.ferm.visible = S.mode === 'ferm';
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); }); var sc = ctx.layer('scale');
      if (S.mode === 'zoo') { G.zB.rotation.y += dt * 0.4; G.zY.rotation.y += dt * 0.3; G.zV.rotation.y += dt * 0.6; lab.a.pos(-1.8, 2.4, 0).set(sc ? 'Virus · ≈ 0.1 μm (×20,000)' : 'Viruses', 'bl-warn').vis(true); lab.b.pos(0.9, 2.6, 0).set(sc ? 'Bacterium · ≈ 2 μm (×1500)' : 'Bacterium', 'bl-neg').vis(true); lab.c.pos(4.4, 3, 0).set(sc ? 'Yeast · ≈ 6 μm (×500)' : 'Yeast', 'bl-pos').vis(true); }
      else if (S.mode === 'cultivo') {
        var N = S.ns + S.nr, shown = Math.round(NB * clamp(Math.log(Math.max(1, N)) / Math.log(K), 0, 1)), fr = N > 0 ? S.nr / N : 0;
        for (var k = 0; k < NB; k++) { var p = bpos[k]; if (k < shown) { dm.position.set(p[0], 0.2, p[1]); dm.rotation.set(Math.PI / 2, 0, p[2]); dm.scale.setScalar(1); } else { dm.position.set(0, -20, 0); dm.scale.setScalar(0.001); } dm.updateMatrix(); bact.setMatrixAt(k, dm.matrix); tmpC.setHex(k < shown * fr || (fr > 0.001 && k % Math.max(2, Math.round(1 / fr)) === 0 && k < shown) ? 0xff922b : 0x51cf66); bact.setColorAt(k, tmpC); }
        bact.instanceMatrix.needsUpdate = true; bact.instanceColor.needsUpdate = true;
        lab.a.pos(0, 1.6, 0).set('t = ' + f1(S.t) + ' h · ' + fmt(N, 0) + ' bacteria/mL (10^' + f1(Math.log(Math.max(1, N)) / Math.LN10) + ')', 'bl-lead').vis(true);
        lab.b.pos(0, 0.9, 4.8).set(S.abx ? 'With antibiotic · resistant: ' + fmt(fr * 100, 1) + ' %' : 'No antibiotic · ' + fmt(S.T, 0) + ' °C', S.abx ? 'bl-warn' : 'bl-d').vis(true);
      } else if (S.mode === 'virus') {
        var c = S.vt % 8, ph = c < 2 ? 0 : c < 3 ? 1 : c < 6 ? 2 : 3;
        viruses.forEach(function (v2, k2) { var ang = k2 / 10 * Math.PI * 2; if (k2 === 0 && ph < 2) { var u = clamp(c / 2, 0, 1); v2.position.set(-4 + 3 * u, 2.4 - 0.6 * u, 0); v2.visible = true; } else if (ph === 2) { v2.visible = k2 > 0 && k2 <= Math.floor((c - 3) / 3 * 9) + 1; v2.position.set(Math.cos(ang) * 0.9, 1 + Math.sin(ang) * 0.35, 0); } else if (ph === 3) { var u2 = (c - 6) / 2; v2.visible = k2 > 0; v2.position.set(Math.cos(ang) * (0.9 + 4 * u2), 1 + Math.sin(ang) * (0.35 + 3 * u2), 0); } else v2.visible = k2 === 0; v2.rotation.y += dt; });
        G.host.visible = ph < 3 || c < 6.4; G.host.children[0].material.opacity = ph === 3 ? 0.2 : 0.55;
        lab.a.pos(0, 3.4, 0).set(['1 · The virus approaches and binds to the cell', '2 · It injects its genetic material', '3 · The cell builds new viruses', '4 · The cell bursts and releases the viruses'][ph], 'bl-warn').vis(true);
      } else if (S.mode === 'hongo') {
        yeasts.forEach(function (y2, k2) { var u = ((S.vt * 0.3 + k2 * 0.2) % 1); y2.userData.bud.scale.setScalar(0.2 + u); y2.rotation.z = Math.sin(S.vt + k2) * 0.1; });
        G.hyph.rotation.y += dt * 0.2; lab.a.pos(-0.4, 2.8, 0).set('Yeasts: budding', 'bl-pos').vis(true); lab.b.pos(2.8, 2.5, 0).set('Mould: hyphae', 'bl-d').vis(true);
      } else {
        bubbles.forEach(function (bb) { var d = bb.userData; d.y += dt * d.s * (0.2 + 0.8 * (S.glu > 1 ? rate() : 0)); if (d.y > 2) d.y = 0; bb.position.set(d.x * 0.6, d.y, d.z * 0.6); bb.visible = S.glu > 1 || d.y > 0.2; });
        G.ballon.scale.setScalar(0.5 + S.co2 / 60); G.liq.material.color.setHex(S.glu > 30 ? 0xffd8a8 : 0xffe8cc);
        lab.a.pos(0, 5, 0).set('Glucose ' + f1(S.glu) + ' g · ethanol ' + f1(S.eth) + ' g · CO₂ ' + f1(S.co2) + ' g', 'bl-lead').vis(true);
        lab.b.pos(0, -0.6, 2).set('C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂', 'bl-d').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.T && u.T.set(S.T); } },
    hud: function () { return { eq: { chip: 'μ', name: { zoo: 'Microorganisms', cultivo: 'Bacterial culture', virus: 'Lytic cycle', hongo: 'Fungi', ferm: 'Alcoholic fermentation' }[S.mode], body: '<div class="eqline"><small>Binary fission</small>N = N₀·2^(t/t<sub>d</sub>)</div><div class="eqline"><small>Fermentation</small>glucose → ethanol + CO₂</div><div class="eqline"><small>Sizes</small>virus 0.1 μm · bacterium 2 μm · yeast 6 μm</div>' }, legend: [{ label: 'Green', color: '#51cf66', text: 'bacteria sensitive to the antibiotic' }, { label: 'Orange', color: '#ff922b', text: 'resistant bacteria' }, { label: 'Purple', color: '#845ef7', text: 'DNA (nucleoid)' }, { label: 'Pink', color: '#f783ac', text: 'plasmid' }] }; },
    measures: function () { var N = S.ns + S.nr, r = rate(); return [['Temperature', fmt(S.T, 0) + ' °C'], ['Growth rate', f2(r) + ' per hour'], ['Doubling time', r > 0 ? fmt(60 * Math.LN2 / r, 0) + ' min' : '—'], ['Bacteria', '10^' + f1(Math.log(Math.max(1, N)) / Math.LN10) + ' per mL'], ['Resistant', N > 0 ? fmt(100 * S.nr / N, 2) + ' %' : '—'], ['Antibiotic', S.abx ? 'yes (dose ×' + f1(S.dose) + ')' : 'no'], ['Fermentation', 'glucose ' + f1(S.glu) + ' g · CO₂ ' + f1(S.co2) + ' g']]; },
    ideas: ['Bacteria: prokaryotes; yeasts: eukaryotes; viruses: not cells.', 'Binary fission: the number doubles each generation.', 'Growth curve: lag, exponential, stationary and death.', 'Antibiotics: only against bacteria; misuse breeds resistance.', 'Viruses: they multiply inside a cell.', 'Biotechnology: bread, wine, yoghurt, antibiotics and copper biomining.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Microbiology lab'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Scene', cols: 3, value: S.mode, options: [{ v: 'zoo', label: 'Compare' }, { v: 'cultivo', label: 'Culture' }, { v: 'virus', label: 'Viruses' }, { v: 'hongo', label: 'Fungi' }, { v: 'ferm', label: 'Fermentation' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.T = kit.ui.slider({ label: 'Temperature (°C)', min: 0, max: 55, step: 1, value: S.T, digits: 0, onInput: function (v) { ctx.goManual(); S.T = v; } });
      ui.dose = kit.ui.slider({ label: 'Antibiotic dose', min: 0.2, max: 2, step: 0.1, value: S.dose, digits: 1, onInput: function (v) { ctx.goManual(); S.dose = v; } });
      c.appendChild(kit.ui.sliders([ui.T, ui.dose]));
      el.appendChild(ctx.btnRow([{ t: 'New culture', primary: true, fn: function () { ctx.goManual(); S.mode = 'cultivo'; S.abx = false; resetCult(); } }, { t: 'Antibiotic on / off', fn: function () { ctx.goManual(); S.mode = 'cultivo'; S.abx = !S.abx; } }, { t: 'New fermentation', fn: function () { ctx.goManual(); S.mode = 'ferm'; resetFerm(); } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Bacterial growth curve (log scale)', h: 230, note: 'Green: sensitive; orange: resistant. Phases: lag, exponential (straight on a log scale), stationary and death.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, H = S.hist, tm = Math.max(12, S.t), sx = function (t) { return L + pw * t / tm; }, sy = function (n) { return Tp + ph - ph * Math.log(Math.max(1, n)) / Math.log(1e10); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 10; i += 2) { cx.beginPath(); cx.moveTo(L, sy(Math.pow(10, i))); cx.lineTo(L + pw, sy(Math.pow(10, i))); cx.stroke(); cx.fillText('10^' + i, L - 4, sy(Math.pow(10, i)) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= tm; i += 4) cx.fillText(i, sx(i), h - B + 13); cx.fillText('time (h)  ·  bacteria/mL', L + pw / 2, h - 3);
        [[1, '#51cf66'], [2, '#ff922b']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); H.forEach(function (q, k) { if (k) cx.lineTo(sx(q[0]), sy(q[c[0]])); else cx.moveTo(sx(q[0]), sy(q[c[0]])); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Alcoholic fermentation', h: 200, note: 'Yeast uses up glucose and produces ethanol and CO₂ (by mass, ≈ 51 % and 49 %).', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, H = S.fhist, tm = Math.max(30, S.ft), sx = function (t) { return L + pw * t / tm; }, sy = function (m) { return Tp + ph - ph * m / 100; }, i;
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('time  ·  mass (g)', L + pw / 2, h - 3); cx.textAlign = 'right'; [0, 50, 100].forEach(function (m) { cx.fillText(m, L - 4, sy(m) + 3); });
        [[1, '#fab005'], [2, '#ae3ec9'], [3, '#868e96']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); H.forEach(function (q, k) { if (k) cx.lineTo(sx(q[0]), sy(q[c[0]])); else cx.moveTo(sx(q[0]), sy(q[c[0]])); }); cx.stroke(); }); cx.lineWidth = 1;
        cx.textAlign = 'left'; cx.fillStyle = '#fab005'; cx.fillText('glucose', L + 6, Tp + 10); cx.fillStyle = '#ae3ec9'; cx.fillText('ethanol', L + 70, Tp + 10); cx.fillStyle = '#868e96'; cx.fillText('CO₂', L + 126, Tp + 10);
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, r = rate(), td = r > 0 ? Math.LN2 / r : 0;
      return '<div class="card-kicker">Growth at ' + fmt(S.T, 0) + ' °C</div><table class="calc-table">' + row('Doubling time', r > 0 ? '<b>' + fmt(td * 60, 0) + ' min</b>' : 'no growth') + row('Bacteria after 8 h (no limit)', r > 0 ? '1 · 2^(' + fmt(8 / td, 1) + ') ≈ <b>10^' + f1(8 / td * Math.log(2) / Math.LN10) + '</b>' : '—') + row('Generations in 24 h', r > 0 ? '<b>' + fmt(24 / td, 0) + '</b>' : '—') + '</table><div class="calc-step">Fermentation</div><table class="calc-table">' + row('Equation', 'C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂') + row('Masses (per 180 g of glucose)', '92 g of ethanol + 88 g of CO₂') + '</table>';
    },
    quiz: [
      { q: 'Viruses differ from bacteria in that they…', options: ['are not cells and only multiply inside one', 'are larger', 'have a nucleus', 'reproduce by binary fission'], answer: 0, why: 'They are obligate parasites.' },
      { q: 'Bacteria are … cells', options: ['prokaryotic, with no nucleus', 'eukaryotic', 'plant', 'with no genetic material'], answer: 0, why: 'Their DNA is in the nucleoid.' },
      { q: 'A bacterium doubles every 20 min. Starting from one, after 2 hours there are…', options: ['64', '12', '6', '128'], answer: 0, why: '6 generations: 2⁶ = 64.' },
      { q: 'In the stationary phase of a culture…', options: ['the number of bacteria holds steady because resources run out', 'they grow faster than ever', 'they all die at once', 'they have not yet started dividing'], answer: 0, why: 'Births and deaths balance.' },
      { q: 'Antibiotics are used to treat…', options: ['bacterial infections', 'flu', 'the common cold', 'any disease'], answer: 0, why: 'They do not act on viruses.' },
      { q: 'Antibiotic resistance increases when antibiotics…', options: ['are used needlessly or the course is stopped early', 'hands are washed', 'people are vaccinated', 'food is cooked well'], answer: 0, why: 'Resistant bacteria are selected.' },
      { q: 'Bread rises thanks to…', options: ['the CO₂ yeast produces when it ferments', 'oxygen from the air', 'yoghurt bacteria', 'salt'], answer: 0, why: 'Alcoholic fermentation.' },
      { q: 'In Chilean copper mining, bacteria are used to…', options: ['release copper from ores (bioleaching)', 'cool the machines', 'make fuels', 'make explosives'], answer: 0, why: 'Biomining with Acidithiobacillus.' }
    ],
    help: { intro: 'In «Lab» choose the scene: compare microorganisms, grow bacteria (with or without antibiotic), watch a virus cycle, look at fungi or follow a fermentation.', items: [['Culture', 'green: sensitive bacteria; orange: resistant. The visible number follows a logarithmic scale.'], ['Temperature', 'changes the growth rate (optimum near 37 °C).'], ['Fermentation', 'the balloon inflates with the CO₂ made by the yeast.']], try: ['Grow at 10, 25 and 37 °C: how long does it take to double?', 'Apply the antibiotic: what fraction ends up resistant?', 'In the fermentation, what happens when the glucose runs out?'] }
  };
  MSim.create(def);
})();
