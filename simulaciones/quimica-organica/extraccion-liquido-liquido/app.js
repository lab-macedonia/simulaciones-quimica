/* Extracción líquido–líquido — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var SOL = { eter: { n: 'Éter dietílico', d: 0.71, c: 0xfff3bf }, ac: { n: 'Acetato de etilo', d: 0.90, c: 0xffe8cc }, dcm: { n: 'Diclorometano', d: 1.33, c: 0xd0ebff } };
  var CMP = { neu: { n: 'Compuesto neutro', K: 6, kind: 'n', pKa: 0, c: 0xff6b6b }, acid: { n: 'Ácido benzoico', K: 8, kind: 'a', pKa: 4.2, c: 0xff922b }, base: { n: 'Anilina', K: 7, kind: 'b', pKa: 4.6, c: 0x845ef7 } };
  var S = { sol: 'eter', cmp: 'neu', r: 1, n: 1, pH: 7, p: 0 }, lab = [], parts = [], fun = null, top = null, bot = null, g = null;
  function fn(c, pH) { if (c.kind === 'a') return 1 / (1 + Math.pow(10, pH - c.pKa)); if (c.kind === 'b') return 1 / (1 + Math.pow(10, c.pKa - pH)); return 1; }
  function D() { var c = CMP[S.cmp]; return c.K * fn(c, S.pH); }
  function Eorg(n, r, d) { return 1 - Math.pow(1 / (1 + d * r / n), n); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.3, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Principio de la extracción', 'Fundamentos', 'Un soluto se reparte entre dos disolventes inmiscibles según su afinidad',
        '<p>La <b>extracción líquido–líquido</b> transfiere un soluto desde una fase (normalmente acuosa) a un disolvente orgánico <b>inmiscible</b>. La fase de <b>menor densidad queda arriba</b>: éter (0,71) y acetato de etilo (0,90) sobre el agua; el diclorometano (1,33) queda <b>abajo</b>. Se usa un <b>embudo de decantación</b>: se agita, se ventea la presión y se separan las fases.</p>'],
      ['Coeficiente de reparto', 'Reparto K', 'K = [soluto]orgánica / [soluto]acuosa en el equilibrio',
        '<p>En el equilibrio, el soluto se reparte según el <b>coeficiente de reparto</b> K = C<sub>org</sub>/C<sub>ac</sub>. Con volúmenes V<sub>org</sub> y V<sub>ac</sub>, la fracción extraída en una etapa es <b>E = K·r/(1 + K·r)</b> con r = V<sub>org</sub>/V<sub>ac</sub>. Cambia K y r y mira cómo se redistribuyen los puntos entre las dos fases.</p>'],
      ['Varias extracciones pequeñas', 'Múltiples', 'Con el mismo volumen total, n porciones extraen más que una grande',
        '<p>Con el mismo volumen total de disolvente orgánico, <b>varias extracciones con porciones pequeñas</b> recuperan más soluto que una sola grande. La fracción que queda en el agua tras n etapas es <b>(1/(1 + K·r/n))<sup>n</sup></b>. Usualmente 3 extracciones son un buen compromiso entre rendimiento y trabajo.</p>'],
      ['Extracción ácido–base', 'Ácido–base', 'Un ácido o base se hace hidrosoluble al ionizarse: el pH controla en qué fase está',
        '<p>Un <b>ácido carboxílico</b> es neutro (orgánico-soluble) a pH &lt; pKa y <b>carboxilato iónico</b> (hidrosoluble) a pH &gt; pKa. Con NaHCO₃ se extrae a la fase acuosa; al acidificar con HCl se recupera. Con una <b>amina</b> ocurre al revés: HCl la convierte en sal acuosa. El coeficiente efectivo es <b>D = K·f<sub>neutro</sub></b>. Así se separan ácidos, bases y neutros de una mezcla.</p>'],
      ['Técnica en el laboratorio', 'Técnica', 'Agitar, ventear, dejar separar y drenar la fase inferior',
        '<p>Buenas prácticas: cerrar la <b>llave</b> antes de añadir; invertir y <b>ventear</b> (sobre todo con éter y con NaHCO₃, que libera CO₂); agitar suavemente; dejar <b>reposar</b>; quitar el tapón antes de drenar; <b>conservar ambas fases</b> hasta terminar. Secar la fase orgánica con Na₂SO₄ o MgSO₄ anhidro y evaporar el disolvente.</p>']
    ];
  }
  var def = {
    key: 'extraccion-liquido-liquido', title: 'Extracción líquido–líquido', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#69db7c', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 4, 20], target: [0, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1, 22], target: [0, 1, 0] }, { id: 'sup', label: 'Superior', pos: [0, 22, 4], target: [0, 1, 0] }],
    layers: [{ id: 'sol', label: 'Moléculas de soluto', icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var glass = mat(0xa5d8ff, 0.22), i;
      fun = new T.Mesh(new T.CylinderGeometry(4.5, 1.1, 11, 28, 1, true), glass); fun.position.y = 2; g.add(fun);
      var cap = new T.Mesh(new T.SphereGeometry(4.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass); cap.position.y = 7.5; g.add(cap);
      var st = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 3, 12), mat(0x495057, 1)); st.position.y = -4.8; g.add(st);
      var key = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1.8, 8), mat(0xe03131, 1)); key.rotation.z = Math.PI / 2; key.position.y = -4.4; g.add(key);
      top = new T.Mesh(new T.CylinderGeometry(4, 3.0, 4, 28), mat(0xfff3bf, 0.5)); g.add(top); bot = new T.Mesh(new T.CylinderGeometry(3.0, 1.2, 4, 28), mat(0x74c0fc, 0.5)); g.add(bot);
      for (i = 0; i < 110; i++) { var m = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), mat(0xff6b6b, 1)); m.userData = { u: Math.random(), a: Math.random() * 6.28, ph: Math.random() * 6.28 }; g.add(m); parts.push(m); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, so = SOL[S.sol], c = CMP[S.cmp];
      if (!P.manual) { var i = f.i; S.p = Math.min(1, f.local * 1.2); if (i === 0) { S.r = 1; S.n = 1; S.cmp = 'neu'; S.pH = 7; } else if (i === 1) { S.cmp = 'neu'; S.n = 1; S.r = 0.5 + 1.5 * Math.abs(Math.sin(f.local * 3.14)); } else if (i === 2) { S.cmp = 'neu'; S.r = 1; S.n = 1 + Math.round(f.local * 4); } else if (i === 3) { S.cmp = 'acid'; S.n = 1; S.r = 1; S.pH = 1 + 9 * f.local; } else { S.cmp = 'neu'; S.n = 3; } }
      var d = D(), E = Eorg(S.n, S.r, d), orgTop = so.d < 1, ph = 0.5 + 0.5 * S.r / (1 + S.r), Hs = 9, hO = Hs * S.r / (1 + S.r), hA = Hs - hO, y0 = -2.2;
      var yA = y0, yO;
      if (orgTop) { bot.scale.y = hA / 4; bot.position.y = y0 + hA / 2; top.scale.y = hO / 4; top.position.y = y0 + hA + hO / 2; bot.material.color.setHex(0x74c0fc); top.material.color.setHex(so.c); }
      else { bot.scale.y = hO / 4; bot.position.y = y0 + hO / 2; top.scale.y = hA / 4; top.position.y = y0 + hO + hA / 2; bot.material.color.setHex(so.c); top.material.color.setHex(0x74c0fc); }
      var orgLo = orgTop ? y0 + hA : y0, aqLo = orgTop ? y0 : y0 + hO, sOn = ctx.layer('sol'), nOrg = Math.round(110 * E * Math.min(1, S.p + 0.15));
      parts.forEach(function (m, j) { var inOrg = j < nOrg, lo = inOrg ? orgLo : aqLo, h = inOrg ? hO : hA; m.material.color.setHex(inOrg ? c.c : 0x228be6); m.position.set(Math.cos(m.userData.a + now * 0.3) * 2.2 * Math.sqrt(m.userData.u), lo + 0.3 + (h - 0.6) * ((m.userData.u * 7 + Math.sin(now * 0.8 + m.userData.ph) * 0.1) % 1), Math.sin(m.userData.a + now * 0.3) * 2.2 * Math.sqrt(m.userData.u)); m.visible = sOn && h > 0.5; });
      g.rotation.y = now * 0.15;
      lab[0].pos(0, 9.5, 0).set(so.n + ' (' + (orgTop ? 'arriba' : 'abajo') + ', d = ' + fmt(so.d, 2) + ')', 'bl-lead').vis(true);
      lab[1].pos(6.5, orgTop ? y0 + hA + hO / 2 : y0 + hO + hA / 2, 0).set(orgTop ? 'Fase orgánica' : 'Fase acuosa', 'bl-d').vis(true);
      lab[2].pos(6.5, orgTop ? y0 + hA / 2 : y0 + hO / 2, 0).set(orgTop ? 'Fase acuosa' : 'Fase orgánica', 'bl-d').vis(true);
      lab[3].pos(0, -7.8, 0).set('Extraído: ' + fmt(E * 100, 1) + ' % · D = ' + fmt(d, 2), E > 0.9 ? 'bl-pos' : 'bl-neg').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sol) u.sol.set(S.sol); if (u.cmp) u.cmp.set(S.cmp); if (u.r) u.r.set(S.r); if (u.n) u.n.set(S.n); if (u.pH) u.pH.set(S.pH); },
    hud: function () { var c = CMP[S.cmp], d = D(), E = Eorg(S.n, S.r, d); return { eq: { chip: fmt(E * 100, 0) + '%', name: c.n, body: '<div class="eqline"><small>K</small>' + fmt(c.K, 1) + '</div><div class="eqline"><small>D efectivo</small>' + fmt(d, 2) + '</div><div class="eqline"><small>Etapas</small>' + S.n + ' × ' + fmt(S.r / S.n, 2) + ' V</div><div class="eqline"><small>Recuperado</small>' + fmt(E * 100, 1) + ' % en orgánica</div>' }, legend: [{ label: 'Punto naranja', color: '#ff922b', text: 'soluto en fase orgánica' }, { label: 'Punto azul', color: '#228be6', text: 'soluto en fase acuosa' }] }; },
    measures: function () { var c = CMP[S.cmp], d = D(), E = Eorg(S.n, S.r, d); return [['Soluto', c.n], ['Disolvente', SOL[S.sol].n], ['K', fmt(c.K, 1)], ['pH acuoso', fmt(S.pH, 1)], ['D = K·f', fmt(d, 2)], ['Extracciones', String(S.n)], ['% extraído', fmt(E * 100, 1) + ' %']]; },
    ideas: ['Varias porciones pequeñas > una grande.', 'Ácido carboxílico: orgánico a pH < pKa; acuoso a pH > pKa.', 'Amina: orgánica a pH alto; acuosa a pH bajo.', 'Ventea el embudo para liberar la presión.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sistema'); el.appendChild(c);
      ui.sol = kit.ui.options({ label: 'Disolvente orgánico', cols: 1, value: S.sol, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].n, sub: 'd = ' + SOL[k].d }; }), onChange: function (v) { ctx.goManual(); S.sol = v; } }); c.appendChild(ui.sol);
      ui.cmp = kit.ui.options({ label: 'Soluto', cols: 1, value: S.cmp, options: Object.keys(CMP).map(function (k) { return { v: k, label: CMP[k].n, sub: 'K = ' + CMP[k].K + (CMP[k].pKa ? ' · pKa ' + CMP[k].pKa : '') }; }), onChange: function (v) { ctx.goManual(); S.cmp = v; } }); c.appendChild(ui.cmp);
      ui.r = kit.ui.slider({ label: 'Volumen orgánico total / acuoso', min: 0.2, max: 3, step: 0.1, value: S.r, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.r = v; } });
      ui.n = kit.ui.slider({ label: 'N.º de extracciones', min: 1, max: 6, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.pH = kit.ui.slider({ label: 'pH de la fase acuosa', min: 0, max: 14, step: 0.1, value: S.pH, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.pH = v; } });
      c.appendChild(kit.ui.sliders([ui.r, ui.n, ui.pH])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: '% extraído según el n.º de extracciones', h: 230, note: 'Volumen orgánico total constante, repartido en n porciones.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, d = D(), n, bw = pw / 8; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center';
        for (n = 1; n <= 8; n++) { var e = Eorg(n, S.r, d); cx.fillStyle = n === S.n ? '#40c057' : '#4dabf7'; cx.fillRect(L + (n - 1) * bw + 4, Tp + ph * (1 - e), bw - 8, ph * e); cx.fillStyle = col.ink; cx.fillText(fmt(e * 100, 0), L + (n - 1) * bw + bw / 2, Tp + ph * (1 - e) - 3); cx.fillStyle = col.muted; cx.fillText(n, L + (n - 1) * bw + bw / 2, h - B + 14); }
        cx.fillText('n.º de extracciones', L + pw / 2, h - 6);
      } },
      { title: 'D efectivo y % extraído frente al pH', h: 230, note: 'Ácido: la extracción cae a pH > pKa. Base: al revés.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, k; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 14; i += 2) cx.fillText(i, L + pw * i / 14, h - B + 14); cx.fillText('pH', L + pw / 2, h - 6);
        ['acid', 'base'].forEach(function (key, j) { var c = CMP[key]; cx.strokeStyle = j ? '#845ef7' : '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 70; i++) { var pH = i / 5, e = Eorg(S.n, S.r, c.K * fn(c, pH)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * pH / 14, Tp + ph * (1 - e)); } cx.stroke(); });
        cx.lineWidth = 1; cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * S.pH / 14, Tp); cx.lineTo(L + pw * S.pH / 14, Tp + ph); cx.stroke(); cx.setLineDash([]); cx.textAlign = 'left'; cx.fillStyle = '#ff922b'; cx.fillText('ácido benzoico', L + 6, Tp + 12); cx.fillStyle = '#845ef7'; cx.fillText('anilina', L + 6, Tp + 24);
      } }
    ],
    calc: function () {
      var c = CMP[S.cmp], f = fn(c, S.pH), d = D(), E1 = Eorg(1, S.r, d), E = Eorg(S.n, S.r, d), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('K', fmt(c.K, 1)) + (c.kind !== 'n' ? row('Fracción neutra f', fmt(f, 4) + ' (pH ' + fmt(S.pH, 1) + ', pKa ' + c.pKa + ')') : '') + row('D = K·f', fmt(d, 3)) + row('r = V<sub>org</sub>/V<sub>ac</sub>', fmt(S.r, 2)) + row('1 etapa: E = D·r/(1 + D·r)', fmt(E1 * 100, 1) + ' %') + row(S.n + ' etapas de r/' + S.n, '<b>' + fmt(E * 100, 1) + ' %</b>') + row('Queda en agua', fmt((1 - E) * 100, 2) + ' %') + '</table>';
    },
    quiz: [
      { q: 'El diclorometano (d = 1,33) con agua queda…', options: ['abajo', 'arriba', 'emulsionado', 'en el medio'], answer: 0, why: 'Más denso que el agua.' },
      { q: 'Con el mismo volumen total, conviene…', options: ['varias extracciones pequeñas', 'una grande', 'ninguna', 'evaporar'], answer: 0, why: '(1/(1+Kr/n))ⁿ es menor al aumentar n.' },
      { q: 'Un ácido carboxílico pasa a la fase acuosa cuando el pH es…', options: ['mayor que su pKa', 'menor que su pKa', 'igual a 7 siempre', 'menor a 0'], answer: 0, why: 'Se ioniza a carboxilato.' },
      { q: 'Una amina se extrae al agua con…', options: ['HCl diluido', 'NaOH', 'Na₂SO₄', 'etanol'], answer: 0, why: 'Forma la sal de amonio hidrosoluble.' },
      { q: 'Al agitar con éter se debe…', options: ['ventear el embudo', 'cerrar herméticamente', 'calentar', 'añadir sal'], answer: 0, why: 'El éter es volátil y sube la presión.' },
      { q: 'K = 6 y r = 1: la fracción extraída en una etapa es…', options: ['6/7 ≈ 86 %', '50 %', '14 %', '100 %'], answer: 0, why: 'E = Kr/(1 + Kr).' }
    ],
    help: { intro: 'Elige disolvente, soluto, volumen y número de extracciones; con ácido o base cambia el pH. Los puntos naranjas están en la fase orgánica.', items: [['Embudo', 'la capa superior es la fase menos densa; puntos naranjas = soluto en la fase orgánica, azules = en la fase acuosa.'], ['Controles', '«Disolvente orgánico», «Soluto», «Volumen orgánico total / acuoso», «N.º de extracciones» y «pH de la fase acuosa».'], ['Gráficos', '«% extraído según el n.º de extracciones» y «D efectivo y % extraído frente al pH».']], try: ['Con el mismo volumen total, compara 1 extracción con 3: varias pequeñas extraen más.', 'Con un ácido carboxílico sube el pH por encima de su pKa: pasa a la fase acuosa.', 'Elige un disolvente más denso que el agua: la fase orgánica queda abajo.'] }
  };
  MSim.create(def);
})();
