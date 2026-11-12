/* Análisis gravimétrico — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var AN = { cl: { n: 'Cloruro (Cl⁻)', a: 'Cl⁻', p: 'AgCl', pm: 143.32, am: 35.45, k: 1, r: 'AgNO₃', c: 0xf1f3f5 }, so4: { n: 'Sulfato (SO₄²⁻)', a: 'SO₄²⁻', p: 'BaSO₄', pm: 233.39, am: 96.06, k: 1, r: 'BaCl₂', c: 0xe9ecef }, fe: { n: 'Hierro (Fe)', a: 'Fe', p: 'Fe₂O₃', pm: 159.69, am: 55.845, k: 2, r: 'NH₃ → Fe(OH)₃ → calcinar', c: 0xc2410c }, ni: { n: 'Níquel (Ni²⁺)', a: 'Ni', p: 'Ni(DMG)₂', pm: 288.91, am: 58.69, k: 1, r: 'dimetilglioxima', c: 0xf03e3e } };
  var S = { an: 'cl', ms: 1.0, pct: 25, ex: 120, co: 0, hum: 0, f: 0, dig: 0, dry: 0 }, g = null, ions = [], ppt = [], lab = [], liq = null, cr = null;
  function A() { return AN[S.an]; }
  function GF() { var a = A(); return a.k * a.am / a.pm; }
  function complete() { return Math.min(1, S.ex / 100) * (S.ex >= 100 ? 0.999 : 1); }
  function mpTrue() { return S.ms * S.pct / 100 / GF(); }
  function mpMeas() { return mpTrue() * complete() * (1 + S.co / 100) * (1 + S.hum / 100); }
  function pctCalc() { return mpMeas() * GF() / S.ms * 100; }
  function stages() {
    return [
      ['Precipitación', 'Precipitar', 'Se añade un exceso de reactivo para precipitar todo el analito',
        '<p>En el <b>análisis gravimétrico</b> el analito se transforma en un precipitado <b>insoluble, puro y de composición definida</b>, que se pesa. Añade el reactivo precipitante: con <b>exceso</b> (≈ 100–150 %) la precipitación es casi completa; con defecto queda analito en disolución y el resultado sale bajo.</p>'],
      ['Digestión y filtración', 'Digestión', 'La digestión crece los cristales y reduce la coprecipitación',
        '<p>Se calienta el precipitado en su disolución madre (<b>digestión</b>): los cristales pequeños se disuelven y recristalizan en otros mayores, más puros y fáciles de filtrar. Se <b>filtra y se lava</b> para eliminar impurezas. La <b>coprecipitación</b> de otros iones aumenta la masa y da un resultado alto.</p>'],
      ['Secado y calcinación', 'Secado', 'Se pesa hasta masa constante',
        '<p>El precipitado se <b>seca o calcina</b> en un crisol hasta <b>masa constante</b> (dos pesadas sucesivas que difieren menos de 0,3 mg). Si queda <b>humedad</b>, la masa sobreestima el analito. Algunos precipitados deben calcinarse para formar una forma estable (Fe(OH)₃ → Fe₂O₃).</p>'],
      ['Cálculo con el factor gravimétrico', 'Cálculo', '% analito = m(precipitado) · FG / m(muestra) × 100',
        '<p>El <b>factor gravimétrico</b> convierte la masa del precipitado en masa de analito: <b>FG = (a · M<sub>analito</sub>) / M<sub>precipitado</sub></b>, con <i>a</i> los átomos de analito por fórmula del precipitado. Luego <b>% = m<sub>pp</sub> · FG / m<sub>muestra</sub> × 100</b>. Compara el valor obtenido con el real y discute los errores.</p>']
    ];
  }
  var def = {
    key: 'gravimetria', title: 'Análisis gravimétrico', subtitle: 'Simulador 3D · química general', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [14, 8, 20], target: [14, 2, 0] }, { id: 'frontal', label: 'Frontal', pos: [14, 3, 24], target: [14, 2, 0] }],
    layers: [{ id: 'ions', label: 'Iones', icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(14, 0, 0); ctx.scene.add(g); var i;
      var bk = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 7, 28, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.2, side: T.DoubleSide })); bk.position.set(-5, 3.5, 0); g.add(bk);
      liq = new T.Mesh(new T.CylinderGeometry(3.1, 3.1, 5, 28), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.45 })); liq.position.set(-5, 2.6, 0); g.add(liq);
      for (i = 0; i < 70; i++) { var a = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), new T.MeshStandardMaterial({ color: 0x1971c2 })); g.add(a); ions.push(a); var p = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshStandardMaterial({ color: 0xf1f3f5 })); g.add(p); ppt.push(p); }
      cr = new T.Mesh(new T.CylinderGeometry(1.5, 1, 1.4, 20, 1, true), new T.MeshStandardMaterial({ color: 0xdee2e6, side: T.DoubleSide })); cr.position.set(5, 1.7, 0); g.add(cr);
      var bal = new T.Mesh(new T.BoxGeometry(5, 0.8, 4), new T.MeshStandardMaterial({ color: 0x495057 })); bal.position.set(5, 0.4, 0); g.add(bal);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.f = f.local * 1.5; S.dig = 0; S.dry = 0; S.co = 1; S.hum = 3; S.ex = 120; } if (i === 1) { S.f = 1.5; S.dig = f.local; S.dry = 0; } if (i === 2) { S.f = 1.5; S.dig = 1; S.dry = f.local; S.hum = 3 * (1 - f.local); } if (i === 3) { S.f = 1.5; S.dig = 1; S.dry = 1; S.hum = 0; } } else { S.f = 1.5; S.dig = 1; S.dry = 1; }
      var cp = Math.min(1, S.f / (S.ex / 100 >= 1 ? 1 : 1)) * complete(), on = ctx.layer('ions'), n = 70, nP = Math.round(n * Math.min(1, cp)), nI = n - Math.round(n * Math.min(1, cp * 0.95)), th = ctx.now;
      ions.forEach(function (m, j) { m.visible = on && j < nI; var a = j * 2.4 + th * 0.3, r = 0.4 + (j % 9) * 0.3; m.position.set(-5 + Math.cos(a) * r, 0.8 + (j * 0.07) % 3.6, Math.sin(a) * r); });
      var sz = 0.5 + S.dig * 0.9, moved = S.dry;
      ppt.forEach(function (m, j) { m.visible = j < nP; var a = j * 2.4, r = 0.3 + (j % 7) * 0.35, sx = -5 + Math.cos(a) * r, sy = 0.35 + (j % 5) * 0.25 * (1 - moved) + (j % 3) * 0.05, sz2 = Math.sin(a) * r; var tx = 5 + Math.cos(a) * r * 0.4, ty = 1.2 + (j % 5) * 0.1 * moved; m.position.set(sx + (tx - sx) * moved, sy + (ty - sy) * moved, sz2 * (1 - moved) + Math.sin(a) * r * 0.4 * moved); m.scale.setScalar(sz * (1 - 0.2 * moved)); m.material.color.setHex(S.dig > 0.5 ? 0xfff9db : 0xf1f3f5); if (A().c) m.material.color.setHex(A().c); });
      liq.visible = moved < 0.5; lab[0].pos(9, 7.6, 0).set(i < 2 || P.manual ? A().r + ' · exceso ' + S.ex + ' %' : '', 'bl-lead').vis(true);
      lab[1].pos(9, 6, 0).set(A().p + ': ' + fmt(mpMeas() * (0.4 + 0.6 * Math.min(1, cp)), 3) + ' g', 'bl-pos').vis(moved > 0.3 || P.manual);
      lab[2].pos(19, 3.2, 0).set('Balanza: ' + fmt(mpMeas() * moved, 4) + ' g', 'bl-d').vis(true);
      lab[3].pos(9, -1, 0).set('FG = ' + fmt(GF(), 4), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['an', 'ms', 'pct', 'ex', 'co', 'hum'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'FG', name: 'Resultado', body: '<div class="eqline"><small>m precipitado</small>' + fmt(mpMeas(), 4) + ' g</div><div class="eqline"><small>% obtenido</small>' + fmt(pctCalc(), 2) + ' %</div><div class="eqline"><small>% real</small>' + fmt(S.pct, 2) + ' %</div><div class="eqline"><small>Error relativo</small>' + fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %</div>' }, legend: [{ label: 'Puntos azules', color: '#1971c2', text: 'analito en disolución' }, { label: 'Esferas claras', color: '#f1f3f5', text: 'precipitado' }] }; },
    measures: function () { return [['Analito', A().a], ['Precipitado', A().p], ['Factor gravimétrico', fmt(GF(), 4)], ['m precipitado', fmt(mpMeas(), 4) + ' g'], ['% obtenido', fmt(pctCalc(), 2) + ' %'], ['Error', fmt((pctCalc() - S.pct) / S.pct * 100, 1) + ' %']]; },
    ideas: ['FG = a·M(analito)/M(precipitado).', 'Exceso de reactivo: precipitación completa.', 'Coprecipitación → resultado alto.', 'Pesar hasta masa constante.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra y reactivo'); el.appendChild(c);
      ui.an = kit.ui.options({ label: 'Analito', cols: 2, value: S.an, options: Object.keys(AN).map(function (k) { return { v: k, label: AN[k].a, sub: '→ ' + AN[k].p }; }), onChange: function (v) { ctx.goManual(); S.an = v; } });
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(ui.an); c.appendChild(kit.ui.sliders([sl('ms', 'Masa de muestra', 0.2, 2, 0.05, function (v) { return fmt(v, 2) + ' g'; }), sl('pct', '% real de analito', 5, 60, 1, function (v) { return v + ' %'; }), sl('ex', 'Reactivo (% del estequiométrico)', 50, 150, 5, function (v) { return v + ' %'; }), sl('co', 'Coprecipitación', 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; }), sl('hum', 'Humedad residual', 0, 5, 0.1, function (v) { return fmt(v, 1) + ' %'; })])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Masa de precipitado frente al reactivo añadido', h: 200, note: 'Con menos del 100 % la precipitación es incompleta.', draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i, mx = mpTrue() * 1.1; cx.strokeStyle = '#b197fc'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 100; i++) { var ex = 50 + i, m = mpTrue() * Math.min(1, ex / 100) * (1 + S.co / 100) * (1 + S.hum / 100), x = L + pw * i / 100, y = Tp + ph * (1 - m / mx); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ex - 50) / 100, Tp + ph * (1 - mpMeas() / mx), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('50 %', L, h - 8); cx.fillText('150 %', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('g', L - 4, Tp + 8);
    } }],
    calc: function () {
      var a = A(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">' + a.n + ' → ' + a.p + '</div><table class="calc-table">' + row('FG', a.k + ' × ' + fmt(a.am, 2) + ' / ' + fmt(a.pm, 2) + ' = <b>' + fmt(GF(), 4) + '</b>') + row('m analito', fmt(S.ms, 2) + ' g × ' + fmt(S.pct, 0) + ' % = ' + fmt(S.ms * S.pct / 100, 4) + ' g') + row('m precipitado (ideal)', fmt(mpTrue(), 4) + ' g') + row('m precipitado (medida)', '<b>' + fmt(mpMeas(), 4) + ' g</b>') + row('% obtenido', fmt(mpMeas(), 4) + ' × ' + fmt(GF(), 4) + ' / ' + fmt(S.ms, 2) + ' × 100 = <b>' + fmt(pctCalc(), 2) + ' %</b>') + '</table>';
    },
    quiz: [
      { q: 'El factor gravimétrico para Cl⁻ pesado como AgCl es…', options: ['0,2474', '4,043', '0,5', '1'], answer: 0, why: '35,45/143,32.' },
      { q: 'Una coprecipitación de impurezas produce un resultado…', options: ['alto', 'bajo', 'exacto', 'indeterminado'], answer: 0, why: 'Aumenta la masa pesada.' },
      { q: 'Se calcina el precipitado hasta…', options: ['masa constante', 'que cambie de color', 'que se funda', 'volumen constante'], answer: 0, why: 'Elimina agua y volátiles.' },
      { q: 'Si el reactivo precipitante es escaso, el resultado es…', options: ['bajo', 'alto', 'correcto', 'depende del filtro'], answer: 0, why: 'Parte del analito queda en disolución.' },
      { q: 'El FG de Fe pesado como Fe₂O₃ (159,69 g/mol; Fe 55,845) es…', options: ['0,6994', '0,3497', '1,4297', '0,5'], answer: 0, why: '2 × 55,845 / 159,69.' },
      { q: 'La digestión del precipitado sirve para…', options: ['obtener cristales mayores y más puros', 'disolverlo', 'aumentar la humedad', 'reducir el FG'], answer: 0, why: 'Recristalización de Ostwald.' }
    ],
    help: { intro: 'Elige el analito, la masa de muestra y los errores posibles. El precipitado se forma en el vaso y se traslada al crisol sobre la balanza.', items: [['Vaso', 'puntos azules = analito aún disuelto; esferas claras = precipitado que se forma.'], ['Balanza', 'el precipitado se filtra, se seca o calcina y se pesa en el crisol hasta masa constante.'], ['Controles', '«Analito», masa de muestra y errores posibles del procedimiento.'], ['Gráfico', '«Masa de precipitado frente al reactivo añadido»: deja de crecer cuando la precipitación es completa.']], try: ['Añade reactivo hasta que la masa de precipitado ya no cambie: ahí la precipitación es completa.', 'Activa un error de coprecipitación: el resultado sale alto.', 'Calcula el % de analito con el factor gravimétrico y compáralo con el del panel.'] }
  };
  MSim.create(def);
})();
