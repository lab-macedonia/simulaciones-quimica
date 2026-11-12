/* El mol y la masa molar — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, NA = 6.02214076e23, VM = 22.414;
  var AM = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990, Cl: 35.45, Fe: 55.845, Ca: 40.078 };
  var SUB = {
    h2o: { n: 'Agua', f: 'H₂O', at: [['O', 1], ['H', 2]], g: { a: [['O', 0, 0, 0], ['H', 1.5, -1.1, 0], ['H', -1.5, -1.1, 0]], b: [[0, 1], [0, 2]] }, gas: false },
    co2: { n: 'Dióxido de carbono', f: 'CO₂', at: [['C', 1], ['O', 2]], g: { a: [['C', 0, 0, 0], ['O', 2.3, 0, 0], ['O', -2.3, 0, 0]], b: [[0, 1, 2], [0, 2, 2]] }, gas: true },
    nh3: { n: 'Amoníaco', f: 'NH₃', at: [['N', 1], ['H', 3]], g: { a: [['N', 0, 0.4, 0], ['H', 1.7, -0.4, 0], ['H', -0.85, -0.4, 1.47], ['H', -0.85, -0.4, -1.47]], b: [[0, 1], [0, 2], [0, 3]] }, gas: true },
    ch4: { n: 'Metano', f: 'CH₄', at: [['C', 1], ['H', 4]], g: { a: [['C', 0, 0, 0], ['H', 1.2, 1.2, 1.2], ['H', -1.2, -1.2, 1.2], ['H', -1.2, 1.2, -1.2], ['H', 1.2, -1.2, -1.2]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] }, gas: true },
    o2: { n: 'Oxígeno', f: 'O₂', at: [['O', 2]], g: { a: [['O', 1.2, 0, 0], ['O', -1.2, 0, 0]], b: [[0, 1, 2]] }, gas: true },
    nacl: { n: 'Cloruro de sodio', f: 'NaCl', at: [['Na', 1], ['Cl', 1]], g: { a: [['Na', -1.7, 0, 0], ['Cl', 1.7, 0, 0]], b: [] }, gas: false },
    fe: { n: 'Hierro', f: 'Fe', at: [['Fe', 1]], g: { a: [['Fe', 0, 0, 0]], b: [] }, gas: false },
    caco3: { n: 'Carbonato de calcio', f: 'CaCO₃', at: [['Ca', 1], ['C', 1], ['O', 3]], g: { a: [['Ca', -3, 0, 0], ['C', 0.8, 0, 0], ['O', 0.8, 1.9, 0], ['O', 2.4, -1, 0], ['O', -0.8, -1, 0]], b: [[1, 2], [1, 3], [1, 4]] }, gas: false }
  };
  var S = { sub: 'h2o', m: 18.015 }, g = null, molG = null, built = '', pile = [], pg = null, lab = [];
  function sci(x, d) { var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (!isFinite(e)) return '0'; return fmt(x / Math.pow(10, e), d) + ' × 10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  function M(k) { var s = SUB[k || S.sub], t = 0; s.at.forEach(function (a) { t += a[1] * AM[a[0]]; }); return t; }
  function nmol() { return S.m / M(); }
  function mainEl() { var s = SUB[S.sub], b = s.at[0]; s.at.forEach(function (a) { if (a[1] * AM[a[0]] > b[1] * AM[b[0]]) b = a; }); return b[0]; }
  function stages() {
    return [
      ['Masa molar', 'Masa molar', 'La masa molar es la suma de las masas atómicas de la fórmula, en g/mol',
        '<p>La <b>masa molar</b> M de una sustancia es la masa de <b>1 mol</b> de ella. Se obtiene <b>sumando las masas atómicas</b> de todos los átomos de la fórmula: M(H₂O) = 2·1,008 + 15,999 = 18,015 g/mol. Cambia de sustancia y observa cómo cambia la suma.</p>'],
      ['El mol y Avogadro', 'Avogadro', '1 mol = 6,022×10²³ entidades, sean átomos, moléculas o iones',
        '<p>Un <b>mol</b> contiene <b>N<sub>A</sub> = 6,022 × 10²³</b> entidades elementales. Es un «paquete» enorme que permite contar partículas pesando. Cada esfera del montón representa <b>10²² partículas</b>: con 60 esferas tienes cerca de un mol.</p>'],
      ['Gramos ↔ moles ↔ partículas', 'Conversiones', 'n = m / M · N = n · N_A',
        '<p>Para pasar de masa a moles se divide por M: <b>n = m / M</b>. Para pasar de moles a partículas se multiplica por Avogadro: <b>N = n · N<sub>A</sub></b>. Mueve la masa y verifica que moles y partículas crecen proporcionalmente.</p>'],
      ['Volumen molar de un gas', 'Gases', 'En CNTP (0 °C, 1 atm) 1 mol de gas ideal ocupa 22,4 L',
        '<p>En <b>condiciones normales</b> (0 °C y 1 atm) un mol de cualquier <b>gas ideal</b> ocupa <b>22,414 L</b>. Así, V = n · 22,414 L. Esto no aplica a sólidos ni líquidos: su volumen depende de la densidad.</p>'],
      ['Composición porcentual', 'Composición', '% de cada elemento = (n átomos · masa atómica) / M × 100',
        '<p>La <b>composición porcentual en masa</b> indica qué fracción de la masa molar aporta cada elemento: <b>% = (n · A<sub>r</sub>) / M × 100</b>. La suma siempre da 100 %.</p>']
    ];
  }
  function rebuild() {
    if (built === S.sub) return; built = S.sub; while (molG.children.length) molG.remove(molG.children[0]);
    molG.add(ctxRef.mol(SUB[S.sub].g, { gs: 1.1, ar: 0.8 }));
    pile.forEach(function (p) { p.material = ctxRef.mat(mainEl()); });
  }
  var ctxRef = null;
  function pcount() { return Math.min(240, Math.round(nmol() * NA / 1e22)); }
  var def_ = {
    key: 'mol-masa-molar', title: 'El mol y la masa molar', subtitle: 'Simulador 3D · química general', accent: { dark: '#74c0fc', light: '#1c6ea4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [5, 6, 24], target: [5, 2, 0] }, { id: 'molecula', label: 'Molécula', pos: [1, 4, 11], target: [1, 2.5, 0] }],
    layers: [{ id: 'pile', label: 'Montón', icon: '•' }],
    onStage: function () {},
    build: function (ctx) {
      ctxRef = ctx; g = new T.Group(); ctx.scene.add(g); molG = new T.Group(); molG.position.set(1, 2.5, 0); g.add(molG);
      pg = new T.Group(); pg.position.set(0, 0, 0); g.add(pg); var i, geo = new T.SphereGeometry(0.42, 12, 10);
      for (i = 0; i < 240; i++) { var s = new T.Mesh(geo, ctx.mat('O')); var c = i % 12, r = Math.floor(i / 12) % 5, l = Math.floor(i / 60); s.position.set(2 + c * 0.95 - 0, 0.5 + r * 0.95, (l - 1.5) * 0.95); s.position.x = 6 + c * 0.95; pg.add(s); pile.push(s); }
      var base = new T.Mesh(new T.BoxGeometry(14, 0.2, 5), new T.MeshStandardMaterial({ color: 0x343a40, roughness: 0.8 })); base.position.set(11.5, -0.2, 0); g.add(base);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['h2o', 'co2', 'nh3', 'caco3', 'nacl'][Math.min(4, Math.floor(f.local * 5))]; S.m = M(S.sub); } if (i === 1) { S.sub = 'fe'; S.m = M() * (0.05 + 0.95 * f.local); } if (i === 2) { S.sub = 'h2o'; S.m = 2 + 100 * f.local; } if (i === 3) { S.sub = 'co2'; S.m = M() * (0.1 + 1.9 * f.local); } if (i === 4) { S.sub = ['caco3', 'h2o', 'nh3'][Math.min(2, Math.floor(f.local * 3))]; S.m = M(S.sub); } }
      rebuild(); molG.rotation.y += 0.01; var np = pcount(), on = ctx.layer('pile');
      pile.forEach(function (p, j) { p.visible = on && j < np; });
      var s = SUB[S.sub], tot = M(), parts = s.at.map(function (a) { return a[1] + '×' + fmt(AM[a[0]], 3); }).join(' + ');
      lab[0].pos(1, 6, 0).set(s.n + ' (' + s.f + ')', 'bl-lead').vis(true);
      lab[1].pos(1, -0.8, 0).set('M = ' + fmt(tot, 2) + ' g/mol', 'bl-pos').vis(true);
      lab[2].pos(11.5, 6.2, 0).set(fmt(nmol(), 3) + " mol · " + sci(nmol() * NA, 2) + ' partículas', 'bl-d').vis(on);
      lab[3].pos(11.5, -1.3, 0).set('cada esfera = 10²² partículas', 'bl-d').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.m) u.m.set(S.m); },
    hud: function () { var s = SUB[S.sub]; return { eq: { chip: 'n', name: 'Conversión', body: '<div class="eqline"><small>Masa</small>' + fmt(S.m, 2) + ' g</div><div class="eqline"><small>Masa molar</small>' + fmt(M(), 3) + ' g/mol</div><div class="eqline"><small>n = m/M</small>' + fmt(nmol(), 4) + ' mol</div><div class="eqline"><small>N = n·N<sub>A</sub></small>' + SimKit.fmt(nmol() * NA / 1e23, 3) + ' × 10²³</div>' }, legend: [{ label: 'Molécula', color: '#74c0fc', text: 'una entidad de ' + s.f }, { label: 'Esferas', color: '#ff6b6b', text: '10²² partículas cada una' }] }; },
    measures: function () { var s = SUB[S.sub]; return [['Sustancia', s.f], ['Masa molar', fmt(M(), 3) + ' g/mol'], ['Masa', fmt(S.m, 2) + ' g'], ['Cantidad', fmt(nmol(), 4) + ' mol'], ['Partículas', sci(nmol() * NA, 3)], ['Volumen en CNTP', s.gas ? fmt(nmol() * VM, 2) + ' L' : 'no aplica (no es gas)']]; },
    ideas: ['M se obtiene sumando masas atómicas.', 'n = m / M.', 'N = n · N_A.', 'Gas ideal en CNTP: 22,4 L/mol.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sustancia y cantidad'); el.appendChild(c);
      ui.sub = kit.ui.options({ label: 'Sustancia', cols: 2, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].f, sub: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); var n = nmol(); S.sub = v; S.m = Math.min(300, n * M()); } });
      ui.m = kit.ui.slider({ label: 'Masa', min: 0.1, max: 300, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      c.appendChild(ui.sub); c.appendChild(kit.ui.sliders([ui.m])); c.appendChild(ctx.btnRow([{ t: '1 mol', fn: function () { ctx.goManual(); S.m = M(); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Composición porcentual en masa', h: 200, note: 'Aporte de cada elemento a la masa molar.', draw: function (cx, w, h, col) {
      var s = SUB[S.sub], tot = M(), L = 10, y = 14, i, pal = ['#74c0fc', '#ff8787', '#ffd43b', '#69db7c'];
      cx.font = '12px system-ui'; cx.textAlign = 'left'; s.at.forEach(function (a, k) { var p = a[1] * AM[a[0]] / tot, bw = (w - 2 * L - 40) * p; cx.fillStyle = pal[k % 4]; cx.fillRect(L, y + k * 40, Math.max(2, bw), 24); cx.fillStyle = col.ink || '#ddd'; cx.fillText(a[0] + ' ' + fmt(p * 100, 1) + ' %', L + 4, y + k * 40 + 40 - 4 - 10); });
    } }],
    calc: function () {
      var s = SUB[S.sub], tot = M(), n = nmol(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      var steps = s.at.map(function (a) { return a[1] + ' × ' + fmt(AM[a[0]], 3) + ' (' + a[0] + ')'; }).join(' + ');
      return '<div class="card-kicker">' + s.n + ' · ' + s.f + '</div><table class="calc-table">' + row('M', steps + ' = <b>' + fmt(tot, 3) + ' g/mol</b>') + row('n = m / M', fmt(S.m, 2) + ' / ' + fmt(tot, 3) + ' = <b>' + fmt(n, 4) + ' mol</b>') + row('N = n · N<sub>A</sub>', fmt(n, 4) + ' × 6,022×10²³ = <b>' + sci(n * NA, 3) + '</b>') + row('V (CNTP)', s.gas ? fmt(n, 4) + ' × 22,414 = <b>' + fmt(n * VM, 2) + ' L</b>' : 'solo para gases') + '</table>';
    },
    quiz: [
      { q: 'La masa molar del agua (H = 1,008; O = 15,999) es…', options: ['18,015 g/mol', '17,007 g/mol', '34,0 g/mol', '16,0 g/mol'], answer: 0, why: '2·1,008 + 15,999.' },
      { q: '¿Cuántos moles hay en 44 g de CO₂ (M = 44 g/mol)?', options: ['1 mol', '44 mol', '0,5 mol', '2 mol'], answer: 0, why: 'n = 44/44.' },
      { q: '2 mol de moléculas contienen…', options: ['1,2×10²⁴ moléculas', '6,0×10²³ moléculas', '3,0×10²³ moléculas', '2 moléculas'], answer: 0, why: '2 × 6,02×10²³.' },
      { q: 'El volumen de 0,5 mol de gas ideal en CNTP es…', options: ['11,2 L', '22,4 L', '44,8 L', '5,6 L'], answer: 0, why: '0,5 × 22,4.' },
      { q: 'El número de Avogadro es…', options: ['6,022×10²³ entidades por mol', '6,022×10²³ g', '22,4 L', '1 mol de átomos de carbono-12 pesan 1 g'], answer: 0, why: 'Entidades en un mol.' },
      { q: '¿Qué contiene más átomos, 1 mol de Fe o 1 mol de H₂?', options: ['Iguales en moléculas/átomos: 1 mol de entidades de cada uno', 'Fe, por pesar más', 'H₂, por ser gas', 'No se puede comparar'], answer: 0, why: 'Un mol es un número de entidades, no una masa.' }
    ],
    help: { intro: 'Elige una sustancia y mueve la masa: el montón de esferas muestra cuántas partículas hay (cada una = 10²²). En «Cálculo» ves el paso a paso.', items: [['Molécula', 'la molécula que gira es una entidad de la sustancia elegida.'], ['Montón', 'cada esfera representa 10²² partículas; el montón crece con la masa.'], ['Controles', '«Sustancia» y «Masa»; la pestaña «Cálculo» convierte gramos → moles → partículas paso a paso.'], ['Gráfico', '«Composición porcentual en masa».']], try: ['Pon 18,0 g de agua: ≈ 1 mol, unas 60 esferas (6,0 × 10²³ moléculas).', 'Compara 1 mol de dos sustancias: el número de esferas es el mismo, aunque la masa no.', 'Revisa la composición del agua: ≈ 11 % de H y 89 % de O en masa.'] }
  };
  MSim.create(def_);

})();
