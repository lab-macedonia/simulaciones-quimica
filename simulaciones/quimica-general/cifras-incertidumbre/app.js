/* Cifras significativas e incertidumbre — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var IN = { bur: { n: 'Bureta 50 mL', u: 0.02, d: 2, un: 'mL', max: 50 }, pip: { n: 'Pipeta graduada 10 mL', u: 0.05, d: 2, un: 'mL', max: 10 }, prob: { n: 'Probeta 100 mL', u: 0.5, d: 0, un: 'mL', max: 100 }, ban: { n: 'Balanza analítica', u: 0.0001, d: 4, un: 'g', max: 100 }, bag: { n: 'Balanza granataria', u: 0.01, d: 2, un: 'g', max: 100 } };
  var S = { bias: 0, sig: 0.6, n: 12, seed: 1, ins: 'bur', val: 23.45, a: 12.3456, sa: 4, b: 3.14159, sb: 3, p: 0 }, lab = [], g = null, shots = [], tgt = null, meas = null;
  function rnd(i) { var x = Math.sin((i + S.seed * 31) * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function gauss(i) { var u = Math.max(1e-6, rnd(2 * i)), v = rnd(2 * i + 1); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function pts() { var a = []; for (var i = 0; i < S.n; i++) a.push({ x: S.bias * 0.7071 + S.sig * gauss(i), y: S.bias * 0.7071 + S.sig * gauss(i + 100) }); return a; }
  function stats() { var p = pts(), n = p.length, mx = 0, my = 0; p.forEach(function (q) { mx += q.x; my += q.y; }); mx /= n; my /= n; var s = 0; p.forEach(function (q) { s += Math.pow(q.x - mx, 2) + Math.pow(q.y - my, 2); }); return { mx: mx, my: my, sd: Math.sqrt(s / (n - 1) / 2), off: Math.hypot(mx, my) }; }
  function sf(x, n) { if (x === 0) return 0; var d = n - Math.floor(Math.log10(Math.abs(x))) - 1, f = Math.pow(10, d); return Math.round(x * f) / f; }
  function sfStr(x, n) { var r = sf(x, n), d = Math.max(0, n - Math.floor(Math.log10(Math.abs(r))) - 1); return fmt(r, d); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Exactitud y precisión', 'Exactitud', 'Exactitud: cerca del valor verdadero. Precisión: resultados cercanos entre sí',
        '<p>La <b>exactitud</b> indica cuán cerca está el promedio del <b>valor verdadero</b>; la <b>precisión</b>, cuán cerca están entre sí las medidas repetidas. El <b>error sistemático</b> (sesgo) afecta la exactitud; el <b>error aleatorio</b> (dispersión) afecta la precisión. En el blanco, el centro es el valor verdadero. Mueve «Sesgo» y «Dispersión» para ver las cuatro combinaciones.</p>'],
      ['Instrumentos e incertidumbre', 'Instrumentos', 'Cada instrumento tiene una incertidumbre: la lectura se escribe hasta ese decimal',
        '<p>Todo instrumento tiene una <b>incertidumbre de lectura</b>: bureta ±0,02 mL, probeta ±0,5 mL, balanza analítica ±0,0001 g. Una medida se escribe <b>valor ± incertidumbre</b>, con el <b>último decimal</b> del valor coincidente con el de la incertidumbre. La <b>incertidumbre relativa</b> u/valor indica la calidad: el mismo error pesa menos en volúmenes grandes.</p>'],
      ['Cifras significativas', 'Cifras sig.', 'Todos los dígitos ciertos más el primero incierto',
        '<p>Las <b>cifras significativas</b> son los dígitos ciertos más el primero dudoso. Reglas: dígitos distintos de cero cuentan; los <b>ceros entre dígitos</b> cuentan; los <b>ceros a la izquierda</b> no; los ceros a la derecha cuentan si hay <b>coma decimal</b>. En <b>sumas y restas</b> manda el menor n.º de <b>decimales</b>; en <b>productos y cocientes</b>, el menor n.º de <b>cifras significativas</b>.</p>'],
      ['Operar con cifras significativas', 'Operaciones', 'Suma: decimales. Producto: cifras',
        '<p>Define dos medidas a y b con distinta cantidad de cifras. La <b>suma</b> se redondea al menor número de <b>decimales</b> de los sumandos; el <b>producto</b> al menor número de <b>cifras significativas</b>. Redondea sólo al final, no en pasos intermedios, para no acumular error.</p>'],
      ['Propagación de la incertidumbre', 'Propagación', 'Suma: incertidumbres absolutas en cuadratura. Producto: relativas en cuadratura',
        '<p>Si a ± u<sub>a</sub> y b ± u<sub>b</sub> (la incertidumbre es 1 en el último dígito): para <b>s = a + b</b>, <b>u<sub>s</sub> = √(u<sub>a</sub>² + u<sub>b</sub>²)</b>; para <b>p = a·b</b>, <b>u<sub>p</sub>/p = √((u<sub>a</sub>/a)² + (u<sub>b</sub>/b)²)</b>. La incertidumbre resultante manda cuántos dígitos se informan.</p>']
    ];
  }
  var def = {
    key: 'cifras-incertidumbre', title: 'Cifras significativas e incertidumbre', subtitle: 'Simulador 3D · química general', accent: { dark: '#ffa94d', light: '#e67700' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 3, 18], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 20], target: [0, 0, 0] }],
    layers: [{ id: 'shots', label: 'Disparos', icon: '•' }, { id: 'mean', label: 'Promedio', icon: '✚' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, cols = [0xf1f3f5, 0x212529, 0x4dabf7, 0x212529, 0xff6b6b, 0xf1f3f5];
      tgt = new T.Group(); tgt.position.set(5, 0, 0); g.add(tgt);
      for (i = 5; i >= 1; i--) { var d = new T.Mesh(new T.CylinderGeometry(i * 1.2, i * 1.2, 0.2, 40), mat(cols[5 - i + 0] || 0xffffff, 1)); d.rotation.x = Math.PI / 2; d.position.z = -0.1 * i; tgt.add(d); }
      for (i = 0; i < 40; i++) { var s = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), mat(0xffd43b, 1)); s.position.z = 0.3; tgt.add(s); shots.push(s); }
      meas = new T.Mesh(new T.SphereGeometry(0.35, 14, 10), mat(0x40c057, 1)); tgt.add(meas);
      var bur = new T.Group(); bur.position.set(-8, 0, 0); g.add(bur); g.userData.bur = bur;
      var tube = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 12, 20, 1, true), mat(0xa5d8ff, 0.25)); bur.add(tube);
      var lq = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 1, 20), mat(0x74c0fc, 0.7)); bur.add(lq); g.userData.lq = lq;
      for (i = 0; i <= 50; i++) { var tk = new T.Mesh(new T.BoxGeometry(i % 10 === 0 ? 0.8 : (i % 5 === 0 ? 0.55 : 0.35), 0.03, 0.03), mat(0x212529, 1)); tk.position.set(0.9 + 0.1, 6 - i * 12 / 50, 0.55); bur.add(tk); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, st = stats(), p = pts(), ins = IN[S.ins], i = f.i;
      if (!P.manual) { if (i === 0) { S.bias = 3 * Math.abs(Math.sin(f.local * 6.28 * 0.5)); S.sig = 0.3 + 1.6 * Math.abs(Math.cos(f.local * 6.28 * 0.5)); } if (i === 1) { S.ins = ['bur', 'pip', 'prob', 'ban', 'bag'][Math.min(4, Math.floor(f.local * 5))]; } }
      ins = IN[S.ins]; if (!P.manual && i === 1) S.val = ins.max * 0.47;
      var sOn = ctx.layer('shots'), mOn = ctx.layer('mean'), showT = i !== 1 || P.manual;
      tgt.visible = !(!P.manual && i === 1) && !(!P.manual && i >= 2); g.userData.bur.visible = !tgt.visible;
      if (P.manual) { tgt.visible = true; g.userData.bur.visible = true; tgt.position.x = 5; g.userData.bur.position.x = -8; }
      shots.forEach(function (s, j) { s.visible = sOn && j < p.length; if (j < p.length) s.position.set(p[j].x * 1.2, p[j].y * 1.2, 0.3); });
      meas.visible = mOn; meas.position.set(st.mx * 1.2, st.my * 1.2, 0.5);
      var frac = S.val / ins.max; g.userData.lq.scale.y = 12 * (1 - frac) + 0.01; g.userData.lq.position.y = 6 - g.userData.lq.scale.y / 2;
      lab[0].pos(5, 8, 0).set('Exactitud: ' + (st.off < 0.6 ? 'alta' : 'baja') + ' · Precisión: ' + (st.sd < 0.7 ? 'alta' : 'baja'), (st.off < 0.6 && st.sd < 0.7) ? 'bl-pos' : 'bl-neg').vis(tgt.visible);
      lab[1].pos(5, -8, 0).set('desvío = ' + fmt(st.off, 2) + ' · s = ' + fmt(st.sd, 2), 'bl-d').vis(tgt.visible);
      lab[2].pos(-8, 7.8, 0).set(ins.n, 'bl-lead').vis(g.userData.bur.visible);
      lab[3].pos(-8, -7.5, 0).set(fmt(S.val, ins.d) + ' ± ' + fmt(ins.u, ins.d) + ' ' + ins.un, 'bl-d').vis(g.userData.bur.visible);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.bias) u.bias.set(S.bias); if (u.sig) u.sig.set(S.sig); if (u.ins) u.ins.set(S.ins); },
    hud: function () { var st = stats(), ins = IN[S.ins], rel = ins.u / S.val * 100; return { eq: { chip: '±', name: 'Medida y error', body: '<div class="eqline"><small>Sesgo medido</small>' + fmt(st.off, 2) + '</div><div class="eqline"><small>Dispersión s</small>' + fmt(st.sd, 2) + '</div><div class="eqline"><small>Instrumento</small>' + ins.n + '</div><div class="eqline"><small>Incert. relativa</small>' + fmt(rel, 2) + ' %</div>' }, legend: [{ label: 'Puntos amarillos', color: '#ffd43b', text: 'medidas repetidas' }, { label: 'Punto verde', color: '#40c057', text: 'promedio' }] }; },
    measures: function () { var st = stats(), ins = IN[S.ins], r = sf(S.a * S.b, Math.min(S.sa, S.sb)); return [['n medidas', String(S.n)], ['Desvío del promedio', fmt(st.off, 2)], ['Desviación estándar', fmt(st.sd, 2)], ['Lectura', fmt(S.val, ins.d) + ' ± ' + fmt(ins.u, ins.d) + ' ' + ins.un], ['a × b informado', sfStr(S.a * S.b, Math.min(S.sa, S.sb))]]; },
    ideas: ['Sesgo → exactitud; dispersión → precisión.', 'Suma: decimales; producto: cifras significativas.', 'Redondea sólo al final.', 'u relativa = u / valor.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Blanco de tiro'); el.appendChild(c);
      ui.bias = kit.ui.slider({ label: 'Sesgo (error sistemático)', min: 0, max: 3, step: 0.1, value: S.bias, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.bias = v; } });
      ui.sig = kit.ui.slider({ label: 'Dispersión (error aleatorio)', min: 0.1, max: 2, step: 0.1, value: S.sig, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.sig = v; } });
      var sn = kit.ui.slider({ label: 'N.º de medidas', min: 3, max: 40, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      c.appendChild(kit.ui.sliders([ui.bias, ui.sig, sn])); c.appendChild(ctx.btnRow([{ t: 'Nueva serie', fn: function () { ctx.goManual(); S.seed++; } }]));
      var d = kit.ui.card('Instrumento'); el.appendChild(d);
      ui.ins = kit.ui.options({ label: 'Instrumento', cols: 1, value: S.ins, options: Object.keys(IN).map(function (k) { return { v: k, label: IN[k].n, sub: '± ' + IN[k].u + ' ' + IN[k].un }; }), onChange: function (v) { ctx.goManual(); S.ins = v; S.val = Math.min(S.val, IN[v].max); } }); d.appendChild(ui.ins);
      var sv = kit.ui.slider({ label: 'Lectura', min: 0, max: 50, step: 0.01, value: S.val, format: function (v) { return fmt(v, IN[S.ins].d) + ' ' + IN[S.ins].un; }, onInput: function (v) { ctx.goManual(); S.val = v; } });
      var sa = kit.ui.slider({ label: 'Cifras sig. de a (12,3456…)', min: 1, max: 6, step: 1, value: S.sa, format: function (v) { return v + ' → ' + sfStr(S.a, v); }, onInput: function (v) { ctx.goManual(); S.sa = v; } });
      var sb = kit.ui.slider({ label: 'Cifras sig. de b (3,14159…)', min: 1, max: 6, step: 1, value: S.sb, format: function (v) { return v + ' → ' + sfStr(S.b, v); }, onInput: function (v) { ctx.goManual(); S.sb = v; } });
      d.appendChild(kit.ui.sliders([sv, sa, sb])); d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Distribución de las medidas', h: 220, note: 'Histograma de la coordenada x. Línea: valor verdadero (0).', draw: function (cx, w, h, col) {
      var p = pts(), L = 20, Rr = 10, Tp = 12, B = 26, pw = w - L - Rr, ph = h - Tp - B, bins = 16, cnt = [], i; for (i = 0; i < bins; i++) cnt.push(0); p.forEach(function (q) { var k = Math.floor((q.x + 4) / 8 * bins); if (k >= 0 && k < bins) cnt[k]++; });
      var mx = Math.max.apply(0, cnt) || 1; cx.fillStyle = '#4dabf7'; cnt.forEach(function (c, k) { cx.fillRect(L + pw * k / bins + 1, Tp + ph * (1 - c / mx), pw / bins - 2, ph * c / mx); });
      cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(L + pw / 2, Tp); cx.lineTo(L + pw / 2, Tp + ph); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('−4', L, h - 8); cx.fillText('0', L + pw / 2, h - 8); cx.fillText('4', L + pw, h - 8);
    } }],
    calc: function () {
      var a = sf(S.a, S.sa), b = sf(S.b, S.sb), da = Math.pow(10, Math.floor(Math.log10(Math.abs(a))) - S.sa + 1), db = Math.pow(10, Math.floor(Math.log10(Math.abs(b))) - S.sb + 1), s = a + b, us = Math.hypot(da, db), pr = a * b, up = pr * Math.hypot(da / a, db / b), dpA = Math.max(0, -Math.floor(Math.log10(da))), dpB = Math.max(0, -Math.floor(Math.log10(db))), dec = Math.min(dpA, dpB), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      return '<div class="card-kicker">a = ' + sfStr(S.a, S.sa) + ' (' + S.sa + ' c.s.) · b = ' + sfStr(S.b, S.sb) + ' (' + S.sb + ' c.s.)</div><table class="calc-table">' + row('a + b (calculadora)', fmt(s, 6)) + row('a + b informado', '<b>' + fmt(s, dec) + '</b> (' + dec + ' decimales)') + row('u<sub>s</sub> = √(u<sub>a</sub>² + u<sub>b</sub>²)', fmt(us, 5)) + row('a · b (calculadora)', fmt(pr, 6)) + row('a · b informado', '<b>' + sfStr(pr, Math.min(S.sa, S.sb)) + '</b> (' + Math.min(S.sa, S.sb) + ' c.s.)') + row('u<sub>p</sub>', fmt(up, 5)) + '</table>';
    },
    quiz: [
      { q: '0,00450 tiene… cifras significativas.', options: ['3', '5', '6', '2'], answer: 0, why: '4, 5 y el cero final con coma decimal.' },
      { q: 'En 12,35 + 3,4 el resultado se informa con…', options: ['1 decimal', '2 decimales', '3 cifras sig. exactas', '4 decimales'], answer: 0, why: '15,75 → 15,8 (manda 3,4).' },
      { q: 'En 2,50 × 3,2 el resultado tiene…', options: ['2 cifras significativas', '3 cifras', '4 cifras', '1 cifra'], answer: 0, why: 'Menor n.º de cifras: 2 → 8,0.' },
      { q: 'Un error sistemático afecta principalmente a la…', options: ['exactitud', 'precisión', 'estadística', 'masa'], answer: 0, why: 'Desplaza todas las medidas.' },
      { q: 'La probeta 100 mL (±0,5) frente a la bureta (±0,02): para 20 mL…', options: ['la bureta tiene menor incertidumbre relativa', 'iguales', 'la probeta es más exacta', 'no se pueden comparar'], answer: 0, why: '0,02/20 ≪ 0,5/20.' },
      { q: 'Los ceros a la izquierda de un número…', options: ['no son significativos', 'son significativos', 'sólo si son pares', 'dependen del signo'], answer: 0, why: 'Sólo fijan la posición de la coma.' }
    ],
    help: { intro: 'En el blanco, mueve sesgo y dispersión. A la izquierda hay un instrumento para leer con su incertidumbre; en «Cálculo» ves sumas y productos con cifras significativas.', items: [['Blanco', 'puntos amarillos = medidas repetidas; punto verde = su promedio; centro = valor verdadero.'], ['Controles', '«Sesgo» (error sistemático) desplaza todas las medidas; «Dispersión» (error aleatorio) las separa; «N.º de medidas» y «Nueva serie» generan otra tanda.'], ['Instrumento', '«Instrumento» y «Lectura» muestran cuántas cifras se pueden informar y con qué incertidumbre.'], ['Cálculo', '«Cifras sig. de a» y «Cifras sig. de b» muestran cómo se redondean sumas y productos.'], ['Gráfico', '«Distribución de las medidas».']], try: ['Pon sesgo alto y dispersión baja: medidas precisas pero inexactas.', 'Compara la bureta con otro instrumento: la bureta tiene menor incertidumbre relativa.', 'Cambia las cifras de a y b: la suma se limita por los decimales y el producto por las cifras significativas.'] }
  };
  MSim.create(def);
})();
