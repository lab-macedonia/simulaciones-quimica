/* PCR y electroforesis en gel — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, LAD = [100, 200, 300, 500, 750, 1000, 1500];
  var S = { cyc: 25, ta: 57, len: 24, gc: 60, bp: 500, ph: 0 }, g = null, str = [], gel = null, bands = [], lab = [], tube = null;
  function tm() { return 64.9 + 41 * (S.gc / 100 * S.len - 16.4) / S.len; }
  function eff() { var d = S.ta - (tm() - 5); return 0.95 * Math.exp(-Math.pow(Math.max(0, d) / 6, 2)); }
  function ns() { var d = S.ta - (tm() - 5); return Math.max(0, Math.min(1, (-d - 3) / 10)); }
  function copies(c) { var n = 1e3 * Math.pow(1 + eff(), c); var cap = 1e12; return n > cap ? cap : n; }
  function inten(n) { return Math.max(0, Math.min(1, (Math.log10(n) - 3) / 9)); }
  function ypos(bp) { return 4.5 - (Math.log10(bp) - 1.7) * 6; }
  function stages() {
    return [
      ['Los componentes', 'Componentes', 'Molde, dos cebadores, polimerasa Taq, dNTP y tampón',
        '<p>La <b>PCR</b> amplifica un fragmento de ADN entre dos <b>cebadores</b>. Necesita ADN molde, cebadores directo e inverso, <b>dNTP</b>, tampón con Mg²⁺ y una <b>ADN polimerasa termoestable</b> (Taq). Todo ocurre en un <b>termociclador</b> que repite ciclos de temperatura.</p>'],
      ['Un ciclo', 'Ciclo', 'Desnaturalización 94 °C → hibridación ~55–60 °C → extensión 72 °C',
        '<p>Cada ciclo tiene tres etapas: <b>desnaturalización</b> (~94 °C, las hebras se separan), <b>hibridación</b> (~Tm − 5 °C, los cebadores se unen) y <b>extensión</b> (72 °C, la polimerasa sintetiza la hebra nueva). Al final del ciclo hay el doble de copias.</p>'],
      ['Amplificación exponencial', 'Exponencial', 'Copias = N₀ · (1 + E)ⁿ',
        '<p>Con eficiencia ideal el número de copias se <b>duplica</b> en cada ciclo: N = N₀·2ⁿ. Tras 30 ciclos hay ~10⁹ veces más ADN. En la práctica la eficiencia E es menor que 1 y al final llega a una <b>meseta</b> por falta de reactivos.</p>'],
      ['Temperatura de hibridación', 'Hibridación', 'Ta ≈ Tm − 5 °C: muy alta no hibrida, muy baja amplifica inespecíficamente',
        '<p>La <b>Tm</b> depende del largo y del %GC del cebador. Si la temperatura de hibridación es <b>muy alta</b>, los cebadores no se unen y casi no hay producto; si es <b>muy baja</b>, se unen donde no deben y aparecen <b>bandas inespecíficas</b>.</p>'],
      ['Electroforesis en gel', 'Gel', 'El ADN (carga −) migra al polo + y los fragmentos pequeños recorren más',
        '<p>El ADN tiene carga negativa y en un campo eléctrico migra hacia el <b>ánodo (+)</b> a través del gel de agarosa; los <b>fragmentos pequeños</b> avanzan más. Se compara con una <b>escalera de pesos moleculares</b> para estimar el tamaño. El control sin molde no debe mostrar banda.</p>']
    ];
  }
  var def = {
    key: 'pcr-electroforesis', title: 'PCR y electroforesis en gel', subtitle: 'Simulador 3D · biología molecular', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 4, 27], target: [6, 1, 0] }, { id: 'gel', label: 'Gel', pos: [13, 1, 15], target: [13, 0, 0] }],
    layers: [{ id: 'gel', label: 'Gel', icon: '▦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      tube = new T.Mesh(new T.CylinderGeometry(3, 1.2, 9, 24, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); tube.position.set(3, 2, 0); g.add(tube);
      for (i = 0; i < 24; i++) { var G = new T.Group(); var a = new T.Mesh(new T.BoxGeometry(2.2, 0.12, 0.12), new T.MeshStandardMaterial({ color: 0x4dabf7 })), b = new T.Mesh(new T.BoxGeometry(2.2, 0.12, 0.12), new T.MeshStandardMaterial({ color: 0xff8787 })); G.add(a); G.add(b); G.userData = { a: a, b: b, s: i }; var ang = i * 2.399, rr = 0.4 + (i % 5) * 0.3; G.position.set(3 + Math.cos(ang) * rr, 0.2 + (i * 0.31) % 4.2, Math.sin(ang) * rr); G.rotation.z = (i % 7) * 0.4; g.add(G); str.push(G); }
      gel = new T.Group(); gel.position.set(15, 0, 0); g.add(gel); var slab = new T.Mesh(new T.BoxGeometry(10, 12, 0.8), new T.MeshStandardMaterial({ color: 0x748ffc, transparent: true, opacity: 0.35 })); gel.add(slab);
      for (i = 0; i < 3; i++) { var w = new T.Mesh(new T.BoxGeometry(2, 0.35, 0.9), new T.MeshStandardMaterial({ color: 0x364fc7 })); w.position.set(-3 + i * 3, 5.2, 0.05); gel.add(w); }
      for (i = 0; i < LAD.length + 4; i++) { var bd = new T.Mesh(new T.BoxGeometry(2, 0.22, 0.95), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaffcc, emissiveIntensity: 0.8, transparent: true })); gel.add(bd); bands.push(bd); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i, k;
      if (!P.manual) { if (i === 0) { S.ph = 0; S.cyc = 0; } if (i === 1) { S.ph = f.local; S.cyc = 1; } if (i === 2) { S.cyc = Math.round(f.local * 30); S.ph = (f.local * 30) % 1; S.ta = 57; S.len = 24; S.gc = 60; } if (i === 3) { S.ta = 45 + 25 * f.local; S.cyc = 30; } if (i === 4) { S.ta = 57; S.cyc = 30; S.bp = 500; } }
      var phs = S.ph, nS = Math.min(24, Math.max(1, Math.round(Math.pow(2, Math.min(S.cyc, 4.6)))));
      str.forEach(function (G, j) { G.visible = j < nS; var sep = phs < 0.33 ? Math.min(1, phs / 0.2) * 0.55 : (phs < 0.66 ? 0.55 : 0.55 * (1 - (phs - 0.66) / 0.34)); G.userData.a.position.y = sep * 0.5; G.userData.b.position.y = -sep * 0.5; });
      var gOn = ctx.layer('gel') && (i === 4 || P.manual); gel.visible = ctx.layer('gel');
      var all = [];
      bands.forEach(function (b) { b.visible = false; });
      LAD.forEach(function (bp, j) { var b = bands[j]; b.visible = true; b.position.set(-3, ypos(bp), 0.05); b.material.opacity = 0.75; b.material.emissiveIntensity = 0.7; });
      var main = copies(S.cyc), idx = LAD.length, mb = bands[idx];
      mb.visible = inten(main) > 0.12; mb.position.set(0, ypos(S.bp), 0.05); mb.material.opacity = 0.2 + 0.8 * inten(main); mb.material.emissiveIntensity = 0.3 + 1.2 * inten(main);
      var n1 = bands[idx + 1], n2 = bands[idx + 2], q = ns(); [n1, n2].forEach(function (b, j) { b.visible = q > 0.05 && inten(main) > 0.12; b.position.set(0, ypos(S.bp * (j ? 1.6 : 0.55)), 0.05); b.material.opacity = 0.15 + 0.7 * q * inten(main); b.material.emissiveIntensity = 0.2 + q; });
      var nt = bands[idx + 3]; nt.visible = q > 0.4; nt.position.set(3, ypos(60), 0.05); nt.material.opacity = 0.15 + 0.4 * q; nt.material.emissiveIntensity = 0.2;
      lab[0].pos(3, 7.4, 0).set('Tubo · ' + (phs < 0.33 ? 'desnaturalización 94 °C' : phs < 0.66 ? 'hibridación ' + fmt(S.ta, 0) + ' °C' : 'extensión 72 °C'), 'bl-lead').vis(true);
      lab[1].pos(3, -3.2, 0).set('ciclo ' + Math.round(S.cyc) + ' · ' + ctxSci(copies(S.cyc) / 1e3) + ' × N₀', 'bl-d').vis(true);
      lab[2].pos(12, -6.8, 0).set('Escalera', 'bl-d').vis(gel.visible); lab[3].pos(15, -6.8, 0).set('Muestra', 'bl-pos').vis(gel.visible); lab[4].pos(18, -6.8, 0).set('Control', 'bl-d').vis(gel.visible);
    },
    sync: function (ctx) { var u = ctx.ui; ['cyc', 'ta', 'len', 'gc', 'bp'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'PCR', name: 'Amplificación', body: '<div class="eqline"><small>Tm cebador</small>' + fmt(tm(), 1) + ' °C</div><div class="eqline"><small>Ta</small>' + fmt(S.ta, 0) + ' °C</div><div class="eqline"><small>Eficiencia</small>' + fmt(eff() * 100, 0) + ' %</div><div class="eqline"><small>Inespecífico</small>' + fmt(ns() * 100, 0) + ' %</div>' }, legend: [{ label: 'Azul/rojo', color: '#4dabf7', text: 'hebras del ADN' }, { label: 'Bandas', color: '#c0ffd0', text: 'fragmentos en el gel' }] }; },
    measures: function () { return [['Ciclos', String(Math.round(S.cyc))], ['Tm cebador', fmt(tm(), 1) + ' °C'], ['Ta', fmt(S.ta, 0) + ' °C'], ['Eficiencia', fmt(eff() * 100, 0) + ' %'], ['Amplificación', ctxSci(copies(S.cyc) / 1e3) + '×'], ['Tamaño esperado', S.bp + ' pb']]; },
    ideas: ['Duplicación por ciclo: 2ⁿ.', 'Ta ≈ Tm − 5 °C.', 'Ta baja → bandas inespecíficas.', 'Fragmentos pequeños migran más.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Programa del termociclador'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('cyc', 'Ciclos', 0, 40, 1, function (v) { return String(v); }), sl('ta', 'Temperatura de hibridación', 40, 72, 1, function (v) { return v + ' °C'; }), sl('len', 'Largo del cebador', 15, 30, 1, function (v) { return v + ' nt'; }), sl('gc', '% GC del cebador', 30, 70, 5, function (v) { return v + ' %'; }), sl('bp', 'Tamaño del producto', 100, 1500, 50, function (v) { return v + ' pb'; })])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Perfil del termociclador (un ciclo)', h: 190, note: '94 °C → Ta → 72 °C', draw: function (cx, w, h, col) {
      var L = 36, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, y = function (t) { return Tp + ph * (1 - (t - 40) / 60); };
      cx.strokeStyle = '#ff8787'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L, y(94)); cx.lineTo(L + pw * 0.33, y(94)); cx.lineTo(L + pw * 0.38, y(S.ta)); cx.lineTo(L + pw * 0.62, y(S.ta)); cx.lineTo(L + pw * 0.67, y(72)); cx.lineTo(L + pw, y(72)); cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; [40, 72, 94].forEach(function (t) { cx.fillText(t + ' °C', L - 4, y(t) + 3); }); cx.textAlign = 'center'; cx.fillText('tiempo', L + pw / 2, h - 6);
    } }, { title: 'Copias frente a ciclos', h: 190, note: 'Escala logarítmica con meseta.', draw: function (cx, w, h, col) {
      var L = 30, R = 10, Tp = 12, B = 24, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#69db7c'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 40; i++) { var v = Math.log10(copies(i)) - 3, x = L + pw * i / 40, y = Tp + ph * (1 - v / 9); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * S.cyc / 40, Tp + ph * (1 - (Math.log10(copies(S.cyc)) - 3) / 9), 4, 0, 6.28); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText('40 ciclos', L + pw, h - 8);
    } }],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">Cebador de ' + S.len + ' nt con ' + S.gc + ' % GC</div><table class="calc-table">' + row('Tm', '64,9 + 41 (%GC·L − 16,4)/L = <b>' + fmt(tm(), 1) + ' °C</b>') + row('Ta recomendada', 'Tm − 5 = <b>' + fmt(tm() - 5, 1) + ' °C</b>') + row('Eficiencia estimada', '<b>' + fmt(eff() * 100, 0) + ' %</b>') + row('Copias tras ' + Math.round(S.cyc) + ' ciclos', 'N₀ · (1 + E)ⁿ = <b>' + ctxSci(copies(S.cyc) / 1e3) + ' × N₀</b>') + row('Ideal (E = 1)', '2ⁿ = ' + ctxSci(Math.pow(2, S.cyc))) + '</table>';
    },
    quiz: [
      { q: 'El orden de las etapas de un ciclo de PCR es…', options: ['desnaturalización, hibridación, extensión', 'extensión, hibridación, desnaturalización', 'hibridación, desnaturalización, extensión', 'desnaturalización, extensión, hibridación'], answer: 0, why: '94 °C, ~55 °C, 72 °C.' },
      { q: 'Con eficiencia 100 %, tras 10 ciclos hay…', options: ['1024 veces más ADN', '100 veces', '20 veces', '10 veces'], answer: 0, why: '2¹⁰.' },
      { q: 'Si la temperatura de hibridación es demasiado baja aparecen…', options: ['bandas inespecíficas', 'ninguna banda', 'bandas más grandes', 'mejor rendimiento sin cambios'], answer: 0, why: 'Los cebadores se unen a sitios parciales.' },
      { q: 'En el gel de agarosa el ADN migra hacia…', options: ['el polo positivo', 'el polo negativo', 'ambos', 'no migra'], answer: 0, why: 'Carga negativa por los fosfatos.' },
      { q: 'Los fragmentos más pequeños…', options: ['recorren más distancia', 'recorren menos', 'quedan en el pocillo', 'migran al otro lado'], answer: 0, why: 'Atraviesan mejor la malla.' },
      { q: 'El control sin molde sirve para…', options: ['detectar contaminación', 'medir la Tm', 'dar la escalera', 'aumentar el producto'], answer: 0, why: 'No debe mostrar la banda.' }
    ],
    help: { intro: 'Ajusta ciclos, temperatura de hibridación y cebadores. A la izquierda está el tubo; a la derecha, el gel con la escalera, la muestra y el control sin molde.', items: [['Tubo (izquierda)', 'hebras azul y roja: ADN molde y copias, que se separan y se copian en cada ciclo.'], ['Gel (derecha)', 'carriles con la escalera de tamaños, la muestra y el control sin molde; las bandas verdes son los productos de PCR.'], ['Controles', 'número de ciclos, temperatura de hibridación (Ta) y cebadores.'], ['Gráficos', '«Perfil del termociclador (un ciclo)»: desnaturalización, hibridación y extensión; y «Copias frente a ciclos» (2ⁿ).']], try: ['Aumenta 10 ciclos: el ADN se multiplica por 2¹⁰ ≈ 1024.', 'Baja la Ta muy por debajo de Tm − 5 °C: aparecen bandas inespecíficas.', 'Compara la banda de la muestra con la escalera para estimar su tamaño; los fragmentos pequeños migran más.'] }
  };
  function ctxSci(x) { var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (!isFinite(e) || e < 3) return fmt(x, 0); return fmt(x / Math.pow(10, e), 2) + ' × 10' + String(e).replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  MSim.create(def);
})();
