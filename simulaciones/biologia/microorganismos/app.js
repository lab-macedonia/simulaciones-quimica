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
      ['Tres tipos de microorganismos', 'Microbios', 'Bacterias, hongos microscópicos y virus: tamaños muy distintos',
        '<p>Los <b>microorganismos</b> solo se ven con microscopio. Las <b>bacterias</b> (≈ 1–5 μm) son células <b>procariotas</b>, sin núcleo. Los <b>hongos</b> microscópicos, como las <b>levaduras</b> (≈ 5–10 μm), son células <b>eucariotas</b>. Los <b>virus</b> (≈ 0,02–0,3 μm) <b>no son células</b>: son material genético dentro de una cubierta de proteínas. Aquí aparecen ampliados a distintas escalas.</p>'],
      ['Bacterias y su crecimiento', 'Bacterias', 'Se reproducen por bipartición: fase de latencia, exponencial, estacionaria y de muerte',
        '<p>Una bacteria tiene <b>pared celular</b>, membrana, citoplasma con ribosomas, un cromosoma circular (<b>nucleoide</b>), a veces <b>plásmidos</b> y <b>flagelos</b>. Se reproduce por <b>bipartición</b>: a 37 °C, algunas se duplican cada 20–30 min. En un cultivo hay una fase de <b>latencia</b>, una <b>exponencial</b>, una <b>estacionaria</b> (se acaban los nutrientes) y una de <b>muerte</b>. La temperatura cambia la rapidez del crecimiento.</p>'],
      ['Virus: parásitos de las células', 'Virus', 'Solo se multiplican dentro de una célula hospedera',
        '<p>Un <b>virus</b> no come ni crece ni se reproduce por sí solo: es <b>parásito obligado</b>. Se une a una célula, introduce su material genético y la obliga a fabricar nuevos virus, que salen y la destruyen (<b>ciclo lítico</b>). Causan enfermedades como la gripe, el sarampión o el COVID-19. Los antibióticos <b>no</b> sirven contra ellos; sí las vacunas y algunos antivirales.</p>'],
      ['Hongos: levaduras y mohos', 'Hongos', 'Unicelulares como la levadura o con hifas como los mohos',
        '<p>Los <b>hongos</b> son eucariotas que se alimentan absorbiendo materia orgánica: son grandes <b>descomponedores</b>. Las <b>levaduras</b> son unicelulares y se reproducen por <b>gemación</b> (brota una célula hija). Los <b>mohos</b> forman filamentos llamados <b>hifas</b>. Algunos causan enfermedades (pie de atleta), otros producen alimentos y medicamentos, como la <b>penicilina</b>.</p>'],
      ['Antibióticos y resistencia', 'Resistencia', 'El antibiótico elimina a las sensibles; las resistentes sobreviven y se multiplican',
        '<p>Los <b>antibióticos</b> matan bacterias o detienen su crecimiento. En una población hay, por azar, unas pocas bacterias <b>resistentes</b> (naranja). Al aplicar el antibiótico mueren las sensibles y las resistentes se multiplican: el cultivo se vuelve resistente. Por eso hay que usar antibióticos <b>solo con receta</b>, completar el tratamiento y <b>nunca</b> usarlos contra virus.</p>'],
      ['Biotecnología', 'Biotecnología', 'Usamos microorganismos para producir alimentos, medicamentos y metales',
        '<p>La <b>biotecnología</b> aprovecha microorganismos: la levadura <b>fermenta</b> la glucosa a <b>etanol y CO₂</b> (el CO₂ hace subir el pan; el etanol, el vino); las bacterias lácticas transforman la lactosa en ácido láctico (<b>yogur</b>, quesos); hongos y bacterias producen <b>antibióticos</b> e <b>insulina</b>. En Chile, la <b>biominería</b> usa bacterias como <i>Acidithiobacillus</i> para liberar <b>cobre</b> de los minerales.</p>']
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
    key: 'microorganismos', title: 'Microorganismos y biotecnología', subtitle: 'Simulador 3D · biología', accent: { dark: '#63e6be', light: '#087f5b' },
    stages: stages, nStages: 6, dur: 14, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.5, 4, 12], target: [-1.2, 1, 0] }, { id: 'sup', label: 'Superior', pos: [-1.2, 14, 1], target: [-1.2, 0, 0] }],
    layers: [{ id: 'scale', label: 'Escala', icon: '↔' }],
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
      if (S.mode === 'zoo') { G.zB.rotation.y += dt * 0.4; G.zY.rotation.y += dt * 0.3; G.zV.rotation.y += dt * 0.6; lab.a.pos(-1.8, 2.4, 0).set(sc ? 'Virus · ≈ 0,1 μm (×20 000)' : 'Virus', 'bl-warn').vis(true); lab.b.pos(0.9, 2.6, 0).set(sc ? 'Bacteria · ≈ 2 μm (×1500)' : 'Bacteria', 'bl-neg').vis(true); lab.c.pos(4.4, 3, 0).set(sc ? 'Levadura · ≈ 6 μm (×500)' : 'Levadura', 'bl-pos').vis(true); }
      else if (S.mode === 'cultivo') {
        var N = S.ns + S.nr, shown = Math.round(NB * clamp(Math.log(Math.max(1, N)) / Math.log(K), 0, 1)), fr = N > 0 ? S.nr / N : 0;
        for (var k = 0; k < NB; k++) { var p = bpos[k]; if (k < shown) { dm.position.set(p[0], 0.2, p[1]); dm.rotation.set(Math.PI / 2, 0, p[2]); dm.scale.setScalar(1); } else { dm.position.set(0, -20, 0); dm.scale.setScalar(0.001); } dm.updateMatrix(); bact.setMatrixAt(k, dm.matrix); tmpC.setHex(k < shown * fr || (fr > 0.001 && k % Math.max(2, Math.round(1 / fr)) === 0 && k < shown) ? 0xff922b : 0x51cf66); bact.setColorAt(k, tmpC); }
        bact.instanceMatrix.needsUpdate = true; bact.instanceColor.needsUpdate = true;
        lab.a.pos(0, 1.6, 0).set('t = ' + f1(S.t) + ' h · ' + fmt(N, 0) + ' bacterias/mL (10^' + f1(Math.log(Math.max(1, N)) / Math.LN10) + ')', 'bl-lead').vis(true);
        lab.b.pos(0, 0.9, 4.8).set(S.abx ? 'Con antibiótico · resistentes: ' + fmt(fr * 100, 1) + ' %' : 'Sin antibiótico · ' + fmt(S.T, 0) + ' °C', S.abx ? 'bl-warn' : 'bl-d').vis(true);
      } else if (S.mode === 'virus') {
        var c = S.vt % 8, ph = c < 2 ? 0 : c < 3 ? 1 : c < 6 ? 2 : 3;
        viruses.forEach(function (v2, k2) { var ang = k2 / 10 * Math.PI * 2; if (k2 === 0 && ph < 2) { var u = clamp(c / 2, 0, 1); v2.position.set(-4 + 3 * u, 2.4 - 0.6 * u, 0); v2.visible = true; } else if (ph === 2) { v2.visible = k2 > 0 && k2 <= Math.floor((c - 3) / 3 * 9) + 1; v2.position.set(Math.cos(ang) * 0.9, 1 + Math.sin(ang) * 0.35, 0); } else if (ph === 3) { var u2 = (c - 6) / 2; v2.visible = k2 > 0; v2.position.set(Math.cos(ang) * (0.9 + 4 * u2), 1 + Math.sin(ang) * (0.35 + 3 * u2), 0); } else v2.visible = k2 === 0; v2.rotation.y += dt; });
        G.host.visible = ph < 3 || c < 6.4; G.host.children[0].material.opacity = ph === 3 ? 0.2 : 0.55;
        lab.a.pos(0, 3.4, 0).set(['1 · El virus se acerca y se une a la célula', '2 · Inyecta su material genético', '3 · La célula fabrica nuevos virus', '4 · La célula estalla y libera los virus'][ph], 'bl-warn').vis(true);
      } else if (S.mode === 'hongo') {
        yeasts.forEach(function (y2, k2) { var u = ((S.vt * 0.3 + k2 * 0.2) % 1); y2.userData.bud.scale.setScalar(0.2 + u); y2.rotation.z = Math.sin(S.vt + k2) * 0.1; });
        G.hyph.rotation.y += dt * 0.2; lab.a.pos(-0.4, 2.8, 0).set('Levaduras: gemación', 'bl-pos').vis(true); lab.b.pos(2.8, 2.5, 0).set('Moho: hifas', 'bl-d').vis(true);
      } else {
        bubbles.forEach(function (bb) { var d = bb.userData; d.y += dt * d.s * (0.2 + 0.8 * (S.glu > 1 ? rate() : 0)); if (d.y > 2) d.y = 0; bb.position.set(d.x * 0.6, d.y, d.z * 0.6); bb.visible = S.glu > 1 || d.y > 0.2; });
        G.ballon.scale.setScalar(0.5 + S.co2 / 60); G.liq.material.color.setHex(S.glu > 30 ? 0xffd8a8 : 0xffe8cc);
        lab.a.pos(0, 5, 0).set('Glucosa ' + f1(S.glu) + ' g · etanol ' + f1(S.eth) + ' g · CO₂ ' + f1(S.co2) + ' g', 'bl-lead').vis(true);
        lab.b.pos(0, -0.6, 2).set('C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂', 'bl-d').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.T && u.T.set(S.T); } },
    hud: function () { return { eq: { chip: 'μ', name: { zoo: 'Microorganismos', cultivo: 'Cultivo bacteriano', virus: 'Ciclo lítico', hongo: 'Hongos', ferm: 'Fermentación alcohólica' }[S.mode], body: '<div class="eqline"><small>Bipartición</small>N = N₀·2^(t/t<sub>d</sub>)</div><div class="eqline"><small>Fermentación</small>glucosa → etanol + CO₂</div><div class="eqline"><small>Tamaños</small>virus 0,1 μm · bacteria 2 μm · levadura 6 μm</div>' }, legend: [{ label: 'Verde', color: '#51cf66', text: 'bacterias sensibles al antibiótico' }, { label: 'Naranja', color: '#ff922b', text: 'bacterias resistentes' }, { label: 'Morado', color: '#845ef7', text: 'ADN (nucleoide)' }, { label: 'Rosado', color: '#f783ac', text: 'plásmido' }] }; },
    measures: function () { var N = S.ns + S.nr, r = rate(); return [['Temperatura', fmt(S.T, 0) + ' °C'], ['Tasa de crecimiento', f2(r) + ' por hora'], ['Tiempo de duplicación', r > 0 ? fmt(60 * Math.LN2 / r, 0) + ' min' : '—'], ['Bacterias', '10^' + f1(Math.log(Math.max(1, N)) / Math.LN10) + ' por mL'], ['Resistentes', N > 0 ? fmt(100 * S.nr / N, 2) + ' %' : '—'], ['Antibiótico', S.abx ? 'sí (dosis ×' + f1(S.dose) + ')' : 'no'], ['Fermentación', 'glucosa ' + f1(S.glu) + ' g · CO₂ ' + f1(S.co2) + ' g']]; },
    ideas: ['Bacterias: procariotas; levaduras: eucariotas; virus: no son células.', 'Bipartición: el número se duplica en cada generación.', 'Curva de crecimiento: latencia, exponencial, estacionaria y muerte.', 'Antibióticos: solo contra bacterias; su mal uso genera resistencia.', 'Virus: se multiplican dentro de una célula.', 'Biotecnología: pan, vino, yogur, antibióticos y biominería del cobre.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Laboratorio de microbiología'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Escena', cols: 3, value: S.mode, options: [{ v: 'zoo', label: 'Comparar' }, { v: 'cultivo', label: 'Cultivo' }, { v: 'virus', label: 'Virus' }, { v: 'hongo', label: 'Hongos' }, { v: 'ferm', label: 'Fermentación' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.T = kit.ui.slider({ label: 'Temperatura (°C)', min: 0, max: 55, step: 1, value: S.T, digits: 0, onInput: function (v) { ctx.goManual(); S.T = v; } });
      ui.dose = kit.ui.slider({ label: 'Dosis de antibiótico', min: 0.2, max: 2, step: 0.1, value: S.dose, digits: 1, onInput: function (v) { ctx.goManual(); S.dose = v; } });
      c.appendChild(kit.ui.sliders([ui.T, ui.dose]));
      el.appendChild(ctx.btnRow([{ t: 'Nuevo cultivo', primary: true, fn: function () { ctx.goManual(); S.mode = 'cultivo'; S.abx = false; resetCult(); } }, { t: 'Antibiótico sí / no', fn: function () { ctx.goManual(); S.mode = 'cultivo'; S.abx = !S.abx; } }, { t: 'Nueva fermentación', fn: function () { ctx.goManual(); S.mode = 'ferm'; resetFerm(); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Curva de crecimiento bacteriano (escala log)', h: 230, note: 'Verde: sensibles; naranja: resistentes. Fases: latencia, exponencial (recta en escala log), estacionaria y muerte.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, H = S.hist, tm = Math.max(12, S.t), sx = function (t) { return L + pw * t / tm; }, sy = function (n) { return Tp + ph - ph * Math.log(Math.max(1, n)) / Math.log(1e10); }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 10; i += 2) { cx.beginPath(); cx.moveTo(L, sy(Math.pow(10, i))); cx.lineTo(L + pw, sy(Math.pow(10, i))); cx.stroke(); cx.fillText('10^' + i, L - 4, sy(Math.pow(10, i)) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= tm; i += 4) cx.fillText(i, sx(i), h - B + 13); cx.fillText('tiempo (h)  ·  bacterias/mL', L + pw / 2, h - 3);
        [[1, '#51cf66'], [2, '#ff922b']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); H.forEach(function (q, k) { if (k) cx.lineTo(sx(q[0]), sy(q[c[0]])); else cx.moveTo(sx(q[0]), sy(q[c[0]])); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Fermentación alcohólica', h: 200, note: 'La levadura consume la glucosa y produce etanol y CO₂ (en masa, ≈ 51 % y 49 %).', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, H = S.fhist, tm = Math.max(30, S.ft), sx = function (t) { return L + pw * t / tm; }, sy = function (m) { return Tp + ph - ph * m / 100; }, i;
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('tiempo  ·  masa (g)', L + pw / 2, h - 3); cx.textAlign = 'right'; [0, 50, 100].forEach(function (m) { cx.fillText(m, L - 4, sy(m) + 3); });
        [[1, '#fab005'], [2, '#ae3ec9'], [3, '#868e96']].forEach(function (c) { cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); H.forEach(function (q, k) { if (k) cx.lineTo(sx(q[0]), sy(q[c[0]])); else cx.moveTo(sx(q[0]), sy(q[c[0]])); }); cx.stroke(); }); cx.lineWidth = 1;
        cx.textAlign = 'left'; cx.fillStyle = '#fab005'; cx.fillText('glucosa', L + 6, Tp + 10); cx.fillStyle = '#ae3ec9'; cx.fillText('etanol', L + 70, Tp + 10); cx.fillStyle = '#868e96'; cx.fillText('CO₂', L + 126, Tp + 10);
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, r = rate(), td = r > 0 ? Math.LN2 / r : 0;
      return '<div class="card-kicker">Crecimiento a ' + fmt(S.T, 0) + ' °C</div><table class="calc-table">' + row('Tiempo de duplicación', r > 0 ? '<b>' + fmt(td * 60, 0) + ' min</b>' : 'no crecen') + row('Bacterias tras 8 h (sin límite)', r > 0 ? '1 · 2^(' + fmt(8 / td, 1) + ') ≈ <b>10^' + f1(8 / td * Math.log(2) / Math.LN10) + '</b>' : '—') + row('Generaciones en 24 h', r > 0 ? '<b>' + fmt(24 / td, 0) + '</b>' : '—') + '</table><div class="calc-step">Fermentación</div><table class="calc-table">' + row('Ecuación', 'C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂') + row('Masas (por 180 g de glucosa)', '92 g de etanol + 88 g de CO₂') + '</table>';
    },
    quiz: [
      { q: 'Los virus se diferencian de las bacterias en que…', options: ['no son células y solo se multiplican dentro de una', 'son más grandes', 'tienen núcleo', 'se reproducen por bipartición'], answer: 0, why: 'Son parásitos obligados.' },
      { q: 'Las bacterias son células…', options: ['procariotas, sin núcleo', 'eucariotas', 'vegetales', 'sin material genético'], answer: 0, why: 'Su ADN está en el nucleoide.' },
      { q: 'Una bacteria se duplica cada 20 min. A partir de una, en 2 horas hay…', options: ['64', '12', '6', '128'], answer: 0, why: '6 generaciones: 2⁶ = 64.' },
      { q: 'En la fase estacionaria de un cultivo…', options: ['el número de bacterias se mantiene porque se agotan los recursos', 'crecen más rápido que nunca', 'todas mueren de golpe', 'aún no empiezan a dividirse'], answer: 0, why: 'Nacimientos y muertes se igualan.' },
      { q: 'Los antibióticos sirven para tratar…', options: ['infecciones bacterianas', 'la gripe', 'el resfrío común', 'cualquier enfermedad'], answer: 0, why: 'No actúan sobre los virus.' },
      { q: 'La resistencia a antibióticos aumenta cuando…', options: ['se usan sin necesidad o se interrumpe el tratamiento', 'se lavan las manos', 'se vacuna la población', 'se cocinan bien los alimentos'], answer: 0, why: 'Se seleccionan las bacterias resistentes.' },
      { q: 'El pan sube gracias a…', options: ['el CO₂ que produce la levadura al fermentar', 'el oxígeno del aire', 'las bacterias del yogur', 'la sal'], answer: 0, why: 'Fermentación alcohólica.' },
      { q: 'En la minería chilena del cobre, las bacterias se usan para…', options: ['liberar el cobre de los minerales (biolixiviación)', 'enfriar las máquinas', 'producir combustibles', 'fabricar explosivos'], answer: 0, why: 'Biominería con Acidithiobacillus.' }
    ],
    help: { intro: 'En «Lab» elige la escena: comparar microorganismos, cultivar bacterias (con o sin antibiótico), ver el ciclo de un virus, observar hongos o seguir una fermentación.', items: [['Cultivo', 'verde: bacterias sensibles; naranja: resistentes. La cantidad visible sigue la escala logarítmica.'], ['Temperatura', 'cambia la rapidez de crecimiento (óptimo cerca de 37 °C).'], ['Fermentación', 'el globo se infla con el CO₂ producido por la levadura.']], try: ['Cultiva a 10, 25 y 37 °C: ¿cuánto tarda en duplicarse?', 'Aplica el antibiótico: ¿qué fracción termina siendo resistente?', 'En la fermentación, ¿qué pasa cuando se acaba la glucosa?'] }
  };
  MSim.create(def);
})();
