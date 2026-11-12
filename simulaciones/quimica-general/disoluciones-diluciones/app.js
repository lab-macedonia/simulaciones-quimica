/* Disoluciones y diluciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var SOL = { nacl: { f: 'NaCl', M: 58.44, d: 2.16, c: 0xf1f3f5 }, cuso4: { f: 'CuSO₄', M: 159.61, d: 3.6, c: 0x339af0 }, kmno4: { f: 'KMnO₄', M: 158.03, d: 2.7, c: 0xae3ec9 }, naoh: { f: 'NaOH', M: 40.0, d: 2.13, c: 0xe9ecef } };
  var S = { s: 'cuso4', m: 15.96, V: 250, C1: 1.0, V1: 50, V2: 250, cB: 0.2, vB: 150 }, g = null, flask = null, liq = null, dots = [], lab = [], mix = null;
  function M() { return SOL[S.s].M; }
  function C() { return S.m / M() / (S.V / 1000); }
  function Cd() { return S.C1 * S.V1 / S.V2; }
  function mixC() { var a = S.C1 * S.V1 + S.cB * S.vB; return a / (S.V1 + S.vB); }
  function stages() {
    return [
      ['Molaridad', 'Molaridad', 'M = moles de soluto / litros de disolución',
        '<p>La <b>molaridad</b> es la cantidad de soluto por litro de <b>disolución</b>: <b>M = n / V</b>. Se pesa el soluto, se disuelve en algo de agua y se <b>enrasa</b> en un matraz aforado hasta la marca. Aumenta la masa de soluto y observa cómo sube la concentración y se intensifica el color.</p>'],
      ['Preparar una disolución', 'Preparar', 'Masa necesaria = M · V · masa molar',
        '<p>Para preparar un volumen V a concentración M se pesan <b>m = M · V · M<sub>molar</sub></b> gramos. Ejemplo: 250 mL de CuSO₄ 0,40 M requieren 0,40 × 0,250 × 159,61 = 15,96 g. El volumen final es el del matraz, no el del agua añadida.</p>'],
      ['Dilución', 'Dilución', 'C₁V₁ = C₂V₂: al diluir cambia el volumen, no los moles',
        '<p>Al diluir se añade disolvente y los <b>moles de soluto no cambian</b>: <b>C₁V₁ = C₂V₂</b>. Toma una alícuota V₁ de una disolución concentrada C₁ y llévala a V₂: la nueva concentración es C₂ = C₁V₁/V₂. El número de partículas es el mismo, pero están más separadas.</p>'],
      ['Mezcla de disoluciones', 'Mezcla', 'Moles totales / volumen total',
        '<p>Al mezclar dos disoluciones del mismo soluto, los <b>moles se suman</b> y los volúmenes también (aprox.): <b>C = (C₁V₁ + C₂V₂) / (V₁ + V₂)</b>. La concentración final queda entre las dos iniciales.</p>']
    ];
  }
  function rgb(c, a) { var col = new T.Color(c), w = new T.Color(0xdbeafe); return w.lerp(col, Math.min(1, a)); }
  var def = {
    key: 'disoluciones-diluciones', title: 'Disoluciones y diluciones', subtitle: 'Simulador 3D · química general', accent: { dark: '#3bc9db', light: '#0b7285' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 5, 22], target: [6, 3, 0] }, { id: 'frontal', label: 'Frontal', pos: [6, 3, 24], target: [6, 3, 0] }],
    layers: [{ id: 'dots', label: 'Partículas', icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      function fl(x) { var G = new T.Group(); G.position.set(x, 0, 0); g.add(G);
        var neck = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 3, 20, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); neck.position.y = 8.5; G.add(neck);
        var bulb = new T.Mesh(new T.SphereGeometry(3, 28, 20), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); bulb.position.y = 3; G.add(bulb);
        var lq = new T.Mesh(new T.SphereGeometry(2.9, 24, 18), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.75 })); lq.position.y = 3; G.add(lq); G.userData.lq = lq; return G; }
      flask = fl(0); mix = fl(8); g.userData.f2 = fl(16);
      for (i = 0; i < 120; i++) { var d = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x1c7ed6 })); flask.add(d); dots.push(d); }
      for (i = 0; i < 120; i++) { var d2 = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: 0x1c7ed6 })); mix.add(d2); dots.push(d2); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.s = 'cuso4'; S.V = 250; S.m = 1 + 39 * f.local; } if (i === 1) { S.s = 'cuso4'; S.V = 250; S.m = 15.96; } if (i === 2) { S.C1 = 1; S.V1 = 50; S.V2 = 50 + 250 * f.local; } if (i === 3) { S.vB = 20 + 280 * f.local; } }
      var s = SOL[S.s], c = C(), on = ctx.layer('dots'), cd = Cd(), cm = mixC(), k;
      var tgt = i === 2 || (P.manual && false);
      flask.userData.lq = flask.children[2]; var sets = [{ g: flask, c: c, n: Math.round(Math.min(120, c * 60)) }, { g: mix, c: i === 2 ? cd : mixC(), n: Math.round(Math.min(120, (i === 2 ? cd : mixC()) * 60)) }];
      flask.children[2].material.color.copy(rgb(s.c === 0xf1f3f5 ? 0x74c0fc : s.c, Math.min(1, c / 0.5)));
      mix.children[2].material.color.copy(rgb(s.c === 0xf1f3f5 ? 0x74c0fc : s.c, Math.min(1, (i === 2 ? cd : cm) / 0.5)));
      var n1 = sets[0].n, n2 = sets[1].n;
      dots.forEach(function (d, j) { var base = j < 120 ? 0 : 120, idx = j - base, n = base ? n2 : n1; d.visible = on && idx < n; var a = idx * 2.399963, r = 2.2 * Math.cbrt((idx % 37 + 1) / 37); var y = 3 + 2.2 * Math.cos(idx * 0.7) * Math.cbrt(((idx * 7) % 41 + 1) / 41); d.position.set(Math.cos(a + ctx.now * 0.3) * r * Math.sin(idx * 0.4 + 0.5), y - 0.2, Math.sin(a + ctx.now * 0.3) * r * Math.sin(idx * 0.4 + 0.5)); d.material.color.setHex(s.c === 0xf1f3f5 ? 0x1971c2 : 0x212529); });
      var sec = i >= 2;
      mix.visible = sec; g.userData.f2.visible = false; flask.position.x = sec ? 0 : 5; mix.position.x = 9; if (!sec) mix.visible = false;
      lab[0].pos(flask.position.x, 10.5, 0).set(s.f + ' ' + fmt(c, 3) + ' M', 'bl-lead').vis(i !== 2 && i !== 3 || P.manual);
      lab[1].pos(flask.position.x, -1, 0).set(fmt(S.m, 2) + ' g en ' + fmt(S.V, 0) + ' mL', 'bl-d').vis(!sec);
      lab[2].pos(0, 10.5, 0).set('C₁ = ' + fmt(S.C1, 2) + ' M · V₁ = ' + fmt(S.V1, 0) + ' mL', 'bl-lead').vis(sec);
      lab[3].pos(9, 10.5, 0).set(i === 3 ? 'mezcla: ' + fmt(cm, 3) + ' M' : 'C₂ = ' + fmt(cd, 3) + ' M · V₂ = ' + fmt(S.V2, 0) + ' mL', 'bl-pos').vis(sec);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.s) u.s.set(S.s); if (u.m) u.m.set(S.m); if (u.V) u.V.set(S.V); if (u.C1) u.C1.set(S.C1); if (u.V1) u.V1.set(S.V1); if (u.V2) u.V2.set(S.V2); if (u.cB) u.cB.set(S.cB); if (u.vB) u.vB.set(S.vB); },
    hud: function () { return { eq: { chip: 'M', name: 'Concentración', body: '<div class="eqline"><small>n soluto</small>' + fmt(S.m / M(), 4) + ' mol</div><div class="eqline"><small>Molaridad</small>' + fmt(C(), 3) + ' M</div><div class="eqline"><small>C₂ (dilución)</small>' + fmt(Cd(), 3) + ' M</div><div class="eqline"><small>Mezcla</small>' + fmt(mixC(), 3) + ' M</div>' }, legend: [{ label: 'Puntos', color: '#212529', text: 'partículas de soluto' }, { label: 'Color', color: '#339af0', text: 'más intenso = más concentrada' }] }; },
    measures: function () { var s = SOL[S.s]; var pc = S.m / (S.V * 1.0 + S.m) * 100; return [['Soluto', s.f], ['Masa molar', fmt(M(), 2) + ' g/mol'], ['n soluto', fmt(S.m / M(), 4) + ' mol'], ['Molaridad', fmt(C(), 3) + ' M'], ['% m/V', fmt(S.m / S.V * 100, 2) + ' %'], ['Dilución C₂', fmt(Cd(), 3) + ' M'], ['Mezcla', fmt(mixC(), 3) + ' M']]; },
    ideas: ['M = n / V (de disolución).', 'Diluir no cambia los moles.', 'C₁V₁ = C₂V₂.', 'Mezclar: suma de moles / volumen total.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Preparar una disolución'); el.appendChild(c);
      ui.s = kit.ui.options({ label: 'Soluto', cols: 2, value: S.s, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].f, sub: fmt(SOL[k].M, 1) + ' g/mol' }; }), onChange: function (v) { ctx.goManual(); S.s = v; } });
      ui.m = kit.ui.slider({ label: 'Masa de soluto', min: 0.5, max: 80, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      ui.V = kit.ui.slider({ label: 'Volumen del matraz', min: 50, max: 1000, step: 50, value: S.V, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V = v; } });
      c.appendChild(ui.s); c.appendChild(kit.ui.sliders([ui.m, ui.V]));
      var d = kit.ui.card('Dilución (C₁V₁ = C₂V₂)'); el.appendChild(d);
      ui.C1 = kit.ui.slider({ label: 'C₁', min: 0.1, max: 5, step: 0.1, value: S.C1, format: function (v) { return fmt(v, 1) + ' M'; }, onInput: function (v) { ctx.goManual(); S.C1 = v; } });
      ui.V1 = kit.ui.slider({ label: 'V₁ (alícuota)', min: 5, max: 200, step: 5, value: S.V1, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V1 = v; } });
      ui.V2 = kit.ui.slider({ label: 'V₂ (volumen final)', min: 50, max: 1000, step: 10, value: S.V2, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V2 = Math.max(v, S.V1); } });
      ui.cB = kit.ui.slider({ label: 'C de la 2.ª disolución (mezcla)', min: 0.05, max: 3, step: 0.05, value: S.cB, format: function (v) { return fmt(v, 2) + ' M'; }, onInput: function (v) { ctx.goManual(); S.cB = v; } });
      ui.vB = kit.ui.slider({ label: 'Volumen de la 2.ª', min: 10, max: 500, step: 10, value: S.vB, format: function (v) { return fmt(v, 0) + ' mL'; }, onInput: function (v) { ctx.goManual(); S.vB = v; } });
      d.appendChild(kit.ui.sliders([ui.C1, ui.V1, ui.V2, ui.cB, ui.vB])); d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Concentración al diluir', h: 220, note: 'C₂ = C₁V₁/V₂ para V₂ desde V₁ hasta 1000 mL.', draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = S.C1; cx.strokeStyle = '#339af0'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var v2 = S.V1 + (1000 - S.V1) * i / 100, c2 = S.C1 * S.V1 / v2, x = L + pw * i / 100, y = Tp + ph * (1 - c2 / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      var px = L + pw * Math.max(0, Math.min(1, (S.V2 - S.V1) / (1000 - S.V1))), py = Tp + ph * (1 - Cd() / mx); cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(px, py, 5, 0, 6.2832); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(fmt(S.V1, 0) + ' mL', L, h - 8); cx.fillText('1000 mL', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText(fmt(mx, 1) + ' M', L - 4, Tp + 8);
    } }],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, n = S.m / M();
      return '<div class="card-kicker">' + SOL[S.s].f + ' · M = ' + fmt(M(), 2) + ' g/mol</div><table class="calc-table">' + row('n = m / M', fmt(S.m, 2) + ' / ' + fmt(M(), 2) + ' = <b>' + fmt(n, 4) + ' mol</b>') + row('Molaridad', fmt(n, 4) + ' / ' + fmt(S.V / 1000, 3) + ' L = <b>' + fmt(C(), 3) + ' M</b>') + row('C₂ = C₁V₁/V₂', fmt(S.C1, 2) + ' × ' + fmt(S.V1, 0) + ' / ' + fmt(S.V2, 0) + ' = <b>' + fmt(Cd(), 3) + ' M</b>') + row('Factor de dilución', '<b>' + fmt(S.V2 / S.V1, 2) + '</b>') + row('Mezcla', '(' + fmt(S.C1, 2) + '×' + fmt(S.V1, 0) + ' + ' + fmt(S.cB, 2) + '×' + fmt(S.vB, 0) + ') / ' + fmt(S.V1 + S.vB, 0) + ' = <b>' + fmt(mixC(), 3) + ' M</b>') + '</table>';
    },
    quiz: [
      { q: '¿Cuántos gramos de NaCl (58,44 g/mol) hay en 500 mL de disolución 0,20 M?', options: ['5,84 g', '11,7 g', '2,92 g', '58,4 g'], answer: 0, why: '0,20 × 0,500 × 58,44.' },
      { q: 'Se diluyen 25 mL de HCl 2,0 M hasta 100 mL. La concentración final es…', options: ['0,50 M', '8,0 M', '1,0 M', '0,25 M'], answer: 0, why: '2,0 × 25 / 100.' },
      { q: 'Al diluir una disolución, los moles de soluto…', options: ['no cambian', 'aumentan', 'disminuyen', 'se duplican'], answer: 0, why: 'Solo se añade disolvente.' },
      { q: 'Se mezclan 100 mL de 1,0 M con 100 mL de 0,20 M del mismo soluto. La concentración final es…', options: ['0,60 M', '1,20 M', '0,20 M', '0,50 M'], answer: 0, why: '(0,10 + 0,020)/0,200.' },
      { q: 'La molaridad usa el volumen de…', options: ['la disolución', 'el disolvente', 'el soluto', 'el agua añadida'], answer: 0, why: 'Litros de disolución.' },
      { q: 'Para pasar de 1,0 M a 0,10 M hay que…', options: ['diluir 10 veces', 'diluir 2 veces', 'concentrar 10 veces', 'agregar soluto'], answer: 0, why: 'Factor de dilución = C₁/C₂ = 10.' }
    ],
    help: { intro: 'En «Lab» elige soluto, masa y matraz. Los puntos son partículas de soluto; el color indica la concentración. Más abajo está la dilución y la mezcla.', items: [['Matraces', 'izquierdo = disolución preparada o concentrada; derecho = diluida o mezcla. Los puntos son partículas de soluto y un color más intenso indica mayor concentración.'], ['Preparar', '«Soluto», «Masa de soluto» y «Volumen del matraz» dan la molaridad M = n / V.'], ['Diluir y mezclar', '«C₁», «V₁ (alícuota)» y «V₂ (volumen final)» aplican C₁V₁ = C₂V₂; «C de la 2.ª disolución» y «Volumen de la 2.ª» calculan una mezcla.'], ['Gráfico', '«Concentración al diluir».']], try: ['Prepara 1 L de NaCl 0,10 M: necesitas 5,84 g.', 'Diluye 10 veces y observa los puntos: son los mismos moles repartidos en más volumen.', 'Mezcla dos disoluciones de distinta concentración: el resultado queda entre ambas.'] }
  };
  MSim.create(def);
})();
