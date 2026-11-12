/* Señalización celular: receptor → segundo mensajero — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, KD = 10, KB = 10, XR = [10, 13, 16, 19, 22];
  var S = { L: 2, eff: 1, B: 0, pde: 0, tox: 0, rtk: 0, c: 0 }, g = null, rec = [], lig = [], gp = [], acm = null, cm = [], pk = [], sub = [], pl = [], lab = [], Hc = [];
  function theta() { return (Math.pow(10, S.L)) / (Math.pow(10, S.L) + KD * (1 + S.B / KB)); }
  function act() { return Math.min(1, theta() * S.eff + S.tox * 0.6); }
  function prod() { return 8 * act(); }
  function kdeg() { return 0.8 * (1 - 0.8 * S.pde); }
  function css() { return prod() / kdeg(); }
  function pka(c) { var n = 1.7, e = 2; return Math.pow(c, n) / (Math.pow(e, n) + Math.pow(c, n)); }
  function ssResp(logL) { var th = Math.pow(10, logL) / (Math.pow(10, logL) + KD * (1 + S.B / KB)), a = Math.min(1, th * S.eff + S.tox * 0.6); return pka(8 * a / kdeg()); }
  function stages() {
    return [
      ['Ligando y receptor', 'Receptor', 'La ocupación del receptor sigue θ = [L] / ([L] + K<sub>d</sub>)',
        '<p>Un <b>ligando</b> (hormona, neurotransmisor) se une a un <b>receptor</b> de membrana de forma reversible. La fracción de receptores ocupados es <b>θ = [L]/([L] + K<sub>d</sub>)</b>; con [L] = K<sub>d</sub> la mitad está ocupada. Sube la concentración del ligando y observa cómo se ocupan los receptores.</p>'],
      ['Proteína G y adenilil ciclasa', 'Proteína G', 'El receptor activa varias proteínas G; la subunidad α activa la adenilil ciclasa',
        '<p>Un receptor acoplado a proteína G (<b>GPCR</b>) ocupado actúa como catalizador: intercambia GDP por GTP en <b>varias proteínas G</b> (primera amplificación). La subunidad <b>Gα·GTP</b> activa a la <b>adenilil ciclasa</b>, que convierte ATP en <b>AMPc</b>.</p>'],
      ['AMPc, PKA y fosfodiesterasa', 'AMPc y PKA', 'AMPc se acumula hasta el equilibrio entre síntesis y degradación',
        '<p>La adenilil ciclasa sintetiza <b>cientos de moléculas de AMPc</b> por segundo (segunda amplificación). El <b>AMPc</b> activa la <b>proteína quinasa A (PKA)</b>, que fosforila muchas proteínas sustrato (tercera amplificación). La <b>fosfodiesterasa (PDE)</b> degrada el AMPc y termina la señal; un inhibidor como la cafeína la prolonga.</p>'],
      ['Agonistas, antagonistas y toxina', 'Fármacos', 'Un antagonista competitivo desplaza la curva dosis–respuesta a la derecha',
        '<p>Un <b>agonista parcial</b> produce una respuesta máxima menor aunque ocupe todos los receptores. Un <b>antagonista competitivo</b> ocupa el sitio sin activarlo y <b>desplaza la curva</b>: hace falta más agonista para la misma respuesta (EC₅₀ aparente mayor). La <b>toxina colérica</b> bloquea la Gα activa y mantiene la ciclasa encendida, con exceso de AMPc.</p>'],
      ['Receptor tirosina quinasa', 'RTK', 'El ligando dimeriza el receptor y activa la autofosforilación',
        '<p>Los <b>receptores tirosina quinasa (RTK)</b> no usan segundos mensajeros clásicos: el ligando provoca la <b>dimerización</b> del receptor, que se <b>autofosforila</b> en tirosinas. Las fosfotirosinas reclutan proteínas adaptadoras que activan <b>Ras → cascada MAPK</b> y controlan proliferación celular. Compara con la cascada del GPCR.</p>']
    ];
  }
  var def = {
    key: 'senalizacion-celular', title: 'Señalización celular: receptor → segundo mensajero', subtitle: 'Simulador 3D · biología', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [17, 3, 24], target: [17, -3, 0] }, { id: 'frontal', label: 'Frontal', pos: [17, -2, 28], target: [17, -3, 0] }],
    layers: [{ id: 'lig', label: 'Ligandos', icon: '●' }, { id: 'cm', label: 'AMPc', icon: '·' }],
    build: function (ctx) {
      g = new T.Group(); g.scale.setScalar(0.7); g.position.set(11.5, 2.1, 0); ctx.scene.add(g); var i, M = function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5 }); };
      var mem = new T.Mesh(new T.BoxGeometry(20, 0.5, 6), new T.MeshStandardMaterial({ color: 0xffd8a8, transparent: true, opacity: 0.8 })); mem.position.set(16, 0, 0); g.add(mem);
      XR.forEach(function (x) { var r = new T.Mesh(new T.CylinderGeometry(0.45, 0.6, 1.8, 12), M(0x748ffc)); r.position.set(x, 0.9, 0); g.add(r); rec.push(r); var G = new T.Mesh(new T.SphereGeometry(0.5, 12, 8), M(0xadb5bd)); G.position.set(x, -1, 0); g.add(G); gp.push(G); var P = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), M(0xffd43b)); g.add(P); pl.push(P); });
      for (i = 0; i < 20; i++) { var l = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), M(0xff922b)); g.add(l); lig.push(l); }
      acm = new T.Mesh(new T.BoxGeometry(2.2, 1.6, 1.6), M(0xadb5bd)); acm.position.set(25.5, -0.3, 0); g.add(acm);
      for (i = 0; i < 70; i++) { var c = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), M(0x22b8cf)); g.add(c); cm.push(c); }
      for (i = 0; i < 4; i++) { var p = new T.Mesh(new T.SphereGeometry(0.7, 12, 10), M(0x868e96)); p.position.set(11 + i * 4.5, -8, 0); g.add(p); pk.push(p); }
      for (i = 0; i < 12; i++) { var s = new T.Mesh(new T.BoxGeometry(0.7, 0.7, 0.7), M(0x868e96)); s.position.set(9 + i * 1.8, -11, 0); g.add(s); sub.push(s); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k, d = Math.min(dt || 0.016, 0.05), th, on = ctx.layer('lig'), con = ctx.layer('cm'), th0 = ctx.now;
      if (!P.manual) { S.rtk = i === 4 ? 1 : 0; S.B = 0; S.eff = 1; S.pde = 0; S.tox = 0; if (i === 0) S.L = -1 + 3.5 * f.local; if (i === 1) S.L = 2.5; if (i === 2) { S.L = f.local < 0.5 ? 2.5 : -2; S.pde = f.local > 0.75 ? 1 : 0; } if (i === 3) { S.L = 2; S.B = f.local < 0.33 ? 0 : (f.local < 0.66 ? 100 : 0); S.tox = f.local > 0.66 ? 1 : 0; } if (i === 4) S.L = 2.5; }
      S.c += d * 2 * (prod() - kdeg() * S.c); Hc.push(S.c); if (Hc.length > 400) Hc.shift();
      th = theta(); var nOcc = Math.round(th * 5), nG = Math.round(act() * 5), rtk = S.rtk === 1, pk0 = pka(S.c);
      rec.forEach(function (r, j) { var occ = j < nOcc; r.material.color.setHex(occ ? 0x4263eb : 0x748ffc); r.rotation.z = rtk && occ ? (j % 2 ? 0.35 : -0.35) : 0; });
      lig.forEach(function (l, j) { var nl = Math.min(20, Math.round(3 + (S.L + 2) * 3)); l.visible = on && j < nl + 0; if (j < nOcc) { l.position.set(XR[j], 2.3, 0); } else { var a = j * 2.4 + th0 * 0.5; l.position.set(9 + (j * 1.7) % 15 + Math.sin(a) * 0.5, 3.5 + (j % 5) * 1.0 + Math.cos(a) * 0.4, Math.sin(a * 1.3) * 2); } });
      gp.forEach(function (G, j) { G.visible = !rtk; G.material.color.setHex(j < nG ? 0xffd43b : 0xadb5bd); G.position.y = -1 - (j < nG ? 0.4 : 0); });
      acm.visible = !rtk; acm.material.color.setHex(act() > 0.3 ? 0x40c057 : 0xadb5bd);
      pl.forEach(function (p, j) { p.visible = rtk && j < nOcc; p.position.set(XR[j] + (j % 2 ? -0.5 : 0.5), -0.7, 0); });
      var nc = Math.min(70, Math.round(S.c * 7)); cm.forEach(function (c, j) { c.visible = con && !rtk && j < nc; var a = j * 2.4 + th0 * (0.4 + (j % 3) * 0.1), r = 1 + (j % 9) * 0.9; c.position.set(16 + Math.cos(a) * (3 + (j % 7) * 1.7), -2.6 - ((j * 0.37) % 4.5) + Math.sin(a) * 0.3, Math.sin(a * 1.1) * 2); });
      pk.forEach(function (p, j) { p.visible = !rtk; p.material.color.set(0x868e96).lerp(new T.Color(0xf03e3e), pk0); });
      sub.forEach(function (s, j) { var on2 = rtk ? j / 12 < Math.min(1, th * S.eff) : j / 12 < pk0; s.material.color.setHex(on2 ? 0xffd43b : 0x868e96); });
      lab[0].pos(22.70, 6.02, 0).set('Receptores ocupados: ' + nOcc + ' / 5 (θ = ' + fmt(th, 2) + ')', 'bl-lead').vis(true);
      lab[1].pos(20.60, 0.35, 0).set(rtk ? 'dimerización y autofosforilación' : 'Proteínas G activas: ' + nG + ' / 5', 'bl-d').vis(true);
      lab[2].pos(29.35, 3.22, 0).set('Adenilil ciclasa', 'bl-d').vis(!rtk);
      lab[3].pos(22.70, -2.80, 0).set(rtk ? 'Ras → MAPK' : 'AMPc = ' + fmt(S.c, 1) + ' µM', rtk ? 'bl-pos' : 'bl-d').vis(true);
      lab[4].pos(22.70, -4.41, 0).set(rtk ? 'Proliferación celular' : 'PKA activa: ' + fmt(pk0 * 100, 0) + ' %', 'bl-pos').vis(true);
      lab[5].pos(22.70, -6.58, 0).set('Proteínas sustrato fosforiladas', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['L', 'eff', 'B', 'pde'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); if (u.tox) u.tox.set(S.tox); if (u.rtk) u.rtk.set(S.rtk); },
    hud: function () { return { eq: { chip: 'cAMP', name: 'Señal', body: '<div class="eqline"><small>[Ligando]</small>' + fmt(Math.pow(10, S.L), Math.pow(10, S.L) < 10 ? 2 : 0) + ' nM</div><div class="eqline"><small>Ocupación θ</small>' + fmt(theta(), 2) + '</div><div class="eqline"><small>AMPc</small>' + fmt(S.c, 1) + ' µM</div><div class="eqline"><small>PKA activa</small>' + fmt(pka(S.c) * 100, 0) + ' %</div>' }, legend: [{ label: 'Naranja', color: '#ff922b', text: 'ligando' }, { label: 'Cian', color: '#22b8cf', text: 'AMPc' }, { label: 'Amarillo', color: '#ffd43b', text: 'proteína G activa / fosfato' }] }; },
    measures: function () { return [['[Ligando]', fmt(Math.pow(10, S.L), 2) + ' nM'], ['Ocupación', fmt(theta() * 100, 0) + ' %'], ['AMPc (actual)', fmt(S.c, 2) + ' µM'], ['AMPc (equilibrio)', fmt(css(), 2) + ' µM'], ['PKA activa', fmt(pka(S.c) * 100, 0) + ' %'], ['Amplificación aprox.', '≈ 10 000×']]; },
    ideas: ['θ = [L]/([L] + Kd).', 'Un receptor activa muchas proteínas G.', 'La PDE termina la señal.', 'Antagonista competitivo: curva a la derecha.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Ligando y fármacos'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('L', 'Ligando (log nM)', -2, 4, 0.1, function (v) { return fmt(Math.pow(10, v), Math.pow(10, v) < 10 ? 2 : 0) + ' nM'; }), sl('eff', 'Eficacia del agonista', 0.1, 1, 0.05, function (v) { return fmt(v, 2); }), sl('B', 'Antagonista competitivo', 0, 1000, 10, function (v) { return v + ' nM'; }), sl('pde', 'Inhibidor de PDE (cafeína)', 0, 1, 0.05, function (v) { return fmt(v * 100, 0) + ' %'; })]));
      ui.tox = kit.ui.options({ label: 'Toxina colérica', cols: 2, value: S.tox, options: [{ v: 0, label: 'No' }, { v: 1, label: 'Sí' }], onChange: function (v) { ctx.goManual(); S.tox = +v; } });
      ui.rtk = kit.ui.options({ label: 'Tipo de receptor', cols: 2, value: S.rtk, options: [{ v: 0, label: 'GPCR' }, { v: 1, label: 'RTK' }], onChange: function (v) { ctx.goManual(); S.rtk = +v; } });
      c.appendChild(ui.tox); c.appendChild(ui.rtk); c.appendChild(ctx.btnRow([{ t: 'Reiniciar AMPc', fn: function () { S.c = 0; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Dosis–respuesta (PKA)', h: 210, note: 'Curva sigmoidea: respuesta en el equilibrio frente a log [ligando]. El antagonista la desplaza a la derecha.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#8ce99a'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 60; i++) { var lg = -2 + 6 * i / 60, y = Tp + ph * (1 - ssResp(lg)), x = L + pw * i / 60; i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.L + 2) / 6, Tp + ph * (1 - ssResp(S.L)), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0,01 nM', L, h - 8); cx.fillText('10 µM', L + pw, h - 8); cx.fillText('log [L]', L + pw / 2, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph);
    } }, { title: 'AMPc en el tiempo', h: 190, note: 'Sube hasta el equilibrio síntesis = degradación.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 22, pw = w - L - R, ph = h - Tp - B, mx = 12; cx.strokeStyle = '#22b8cf'; cx.lineWidth = 2; cx.beginPath(); Hc.forEach(function (v, i) { var x = L + pw * (i + (400 - Hc.length)) / 400, y = Tp + ph * (1 - Math.min(1, v / mx)); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillText('12 µM', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph); cx.textAlign = 'center'; cx.fillText('tiempo →', L + pw / 2, h - 6);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, L = Math.pow(10, S.L); return '<div class="card-kicker">K<sub>d</sub> = 10 nM · K<sub>b</sub> = 10 nM</div><table class="calc-table">' + row('θ', fmt(L, 2) + ' / (' + fmt(L, 2) + ' + 10·(1 + ' + fmt(S.B, 0) + '/10)) = <b>' + fmt(theta(), 3) + '</b>') + row('Activación', 'θ × eficacia' + (S.tox ? ' + toxina' : '') + ' = <b>' + fmt(act(), 2) + '</b>') + row('AMPc (equilibrio)', 'síntesis / degradación = ' + fmt(prod(), 1) + ' / ' + fmt(kdeg(), 2) + ' = <b>' + fmt(css(), 1) + ' µM</b>') + row('PKA activa', 'c<sup>1,7</sup> / (2<sup>1,7</sup> + c<sup>1,7</sup>) = <b>' + fmt(pka(S.c) * 100, 0) + ' %</b>') + row('Amplificación', '≈ 10 G × 100 AMPc × 10 sustratos ≈ <b>10 000×</b> por receptor') + '</table>'; },
    quiz: [
      { q: 'Si [L] = K<sub>d</sub>, la fracción de receptores ocupados es…', options: ['0,5', '0,1', '0,9', '1'], answer: 0, why: 'θ = K/(K + K) = 0,5.' },
      { q: 'Un receptor activado puede activar…', options: ['varias proteínas G', 'una sola proteína G', 'ninguna', 'solo ATP'], answer: 0, why: 'Primera amplificación.' },
      { q: 'La fosfodiesterasa…', options: ['degrada AMPc y apaga la señal', 'sintetiza AMPc', 'fosforila la PKA', 'une el ligando'], answer: 0, why: 'AMPc → AMP.' },
      { q: 'Un antagonista competitivo desplaza la curva dosis–respuesta…', options: ['a la derecha', 'a la izquierda', 'hacia arriba', 'no la cambia'], answer: 0, why: 'Se necesita más agonista.' },
      { q: 'La toxina colérica causa…', options: ['exceso de AMPc por Gα activa permanente', 'falta de AMPc', 'bloqueo del receptor', 'degradación de PKA'], answer: 0, why: 'Mantiene la adenilil ciclasa activa.' },
      { q: 'Un receptor tirosina quinasa se activa por…', options: ['dimerización y autofosforilación', 'AMPc', 'apertura de un canal', 'hidrólisis de GTP únicamente'], answer: 0, why: 'Luego Ras → MAPK.' }
    ],
    help: { intro: 'Cambia la concentración del ligando, la eficacia y los fármacos. Verás cómo se ocupan los receptores, se activan las proteínas G y sube el AMPc. En «Gráficos» está la curva dosis–respuesta.', items: [['Escena', 'esferas naranjas = ligandos; amarillas = proteína G activa o fosfato; cian = AMPc producido.'], ['Controles', 'concentración de ligando, eficacia y fármacos, «Toxina colérica» y «Tipo de receptor» (GPCR o RTK); «Reiniciar AMPc» vacía el segundo mensajero.'], ['Gráficos', '«Dosis–respuesta (PKA)» y «AMPc en el tiempo».']], try: ['Con [L] = Kd la ocupación θ es 0,5.', 'Activa la toxina colérica: Gα queda activa y el AMPc se acumula sin control.', 'Cambia a RTK: la señal pasa por dimerización y autofosforilación en vez de la proteína G.'] }
  };
  MSim.create(def);
})();
