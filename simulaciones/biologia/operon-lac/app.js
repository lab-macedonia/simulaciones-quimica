/* Operón lac y regulación génica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var MU = { wt: 'Cepa silvestre', laci: 'Mutante lacI⁻ (sin represor)', laco: 'Mutante lacOᶜ (operador constitutivo)' };
  var S = { lac: 0, glu: 0, mu: 'wt' }, g = null, rep = null, pol = null, cap = null, mr = [], en = [], lab = [], gene = {};
  function bound() { if (S.mu !== 'wt') return 0; return S.lac ? 0.02 : 0.98; }
  function capAct() { return S.glu ? 0.1 : 1; }
  function expr(lac, glu, mu) { var o = { lac: S.lac, glu: S.glu, mu: S.mu }; if (lac != null) { S.lac = lac; S.glu = glu; S.mu = mu; } var b = bound(), v = Math.max(0.01, (1 - b)) * (0.1 + 0.9 * capAct()) * 100; if (S.mu === 'laco' && S.glu === 0) v = 100 * 0.9 + 10; S.lac = o.lac; S.glu = o.glu; S.mu = o.mu; return Math.min(100, v); }
  function lvl() { return expr(); }
  function stages() {
    return [
      ['Componentes del operón', 'Componentes', 'lacI codifica el represor; P es el promotor; O el operador; lacZ, lacY y lacA los genes estructurales',
        '<p>El <b>operón lac</b> de <i>E. coli</i> agrupa tres genes que se transcriben juntos: <b>lacZ</b> (β-galactosidasa, rompe la lactosa), <b>lacY</b> (permeasa) y <b>lacA</b> (transacetilasa). Antes están el <b>promotor</b> (P) y el <b>operador</b> (O). El gen regulador <b>lacI</b> produce el <b>represor</b>, que se une al operador.</p>'],
      ['Sin lactosa: represión', 'Sin lactosa', 'El represor bloquea al operador y la ARN polimerasa no avanza',
        '<p>Sin lactosa, el <b>represor LacI</b> se une al <b>operador</b> y <b>bloquea</b> a la ARN polimerasa: casi no hay transcripción (expresión basal ≈ 1–2 %). La célula no gasta energía en enzimas que no necesita: es un <b>control negativo</b>.</p>'],
      ['Con lactosa: inducción', 'Con lactosa', 'La alolactosa se une al represor y lo libera del operador',
        '<p>La lactosa se convierte en <b>alolactosa</b>, el <b>inductor</b>, que se une al represor y cambia su forma: éste <b>se suelta</b> del operador. La ARN polimerasa transcribe lacZYA, se forma un ARNm policistrónico y aparecen las tres enzimas.</p>'],
      ['Glucosa y AMPc–CAP', 'Glucosa y CAP', 'Con glucosa baja el AMPc, no se forma CAP–AMPc y el promotor es débil',
        '<p>La <b>glucosa</b> es la fuente preferida. Cuando abunda, el <b>AMPc</b> es bajo y el activador <b>CAP</b> no se une al promotor: aun con lactosa la transcripción es <b>baja</b> (<b>represión catabólica</b>, control positivo). Sin glucosa, <b>CAP–AMPc</b> ayuda a reclutar la polimerasa y la expresión es máxima.</p>'],
      ['Mutantes (desafío)', 'Mutantes', 'lacI⁻ y lacOᶜ expresan sin lactosa',
        '<p>Un mutante <b>lacI⁻</b> no produce represor funcional; uno <b>lacOᶜ</b> tiene un operador al que el represor no se une. En ambos casos el operón se expresa <b>de forma constitutiva</b>, incluso sin lactosa. Predice la expresión en cada condición y comprueba.</p>']
    ];
  }
  var X = { I: 14, P: 17, O: 19.2, Z: 22, Y: 25, A: 28 };
  var def = {
    key: 'operon-lac', title: 'Operón lac y regulación génica', subtitle: 'Simulador 3D · biología molecular', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [15, 6, 22], target: [15, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [15, 1, 26], target: [15, 1, 0] }],
    layers: [{ id: 'prod', label: 'ARNm y enzimas', icon: '◉' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      var dna = new T.Mesh(new T.BoxGeometry(16.5, 0.18, 0.5), new T.MeshStandardMaterial({ color: 0x748ffc })); dna.position.set(21.25, 0, 0); g.add(dna);
      function seg(k, w, c) { var m = new T.Mesh(new T.BoxGeometry(w, 0.9, 0.9), new T.MeshStandardMaterial({ color: c })); m.position.set(X[k], 0, 0); g.add(m); gene[k] = m; }
      seg('I', 1.8, 0x9775fa); seg('P', 1.4, 0x51cf66); seg('O', 0.9, 0xff6b6b); seg('Z', 2.4, 0xffa94d); seg('Y', 2.4, 0xffd43b); seg('A', 2.4, 0x63e6be);
      rep = new T.Mesh(new T.SphereGeometry(0.8, 18, 14), new T.MeshStandardMaterial({ color: 0x9775fa })); g.add(rep);
      pol = new T.Mesh(new T.SphereGeometry(0.9, 18, 14), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(pol);
      cap = new T.Mesh(new T.OctahedronGeometry(0.5), new T.MeshStandardMaterial({ color: 0xffd43b })); g.add(cap);
      for (i = 0; i < 6; i++) { var m = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshStandardMaterial({ color: 0xffe8cc })); g.add(m); mr.push(m); }
      for (i = 0; i < 9; i++) { var e = new T.Mesh(new T.SphereGeometry(0.35, 10, 8), new T.MeshStandardMaterial({ color: [0xffa94d, 0xffd43b, 0x63e6be][i % 3] })); g.add(e); en.push(e); }
      for (i = 0; i < 9; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.lac = 0; S.glu = 0; S.mu = 'wt'; } if (i === 1) { S.lac = 0; S.glu = 0; S.mu = 'wt'; } if (i === 2) { S.lac = 1; S.glu = 0; S.mu = 'wt'; } if (i === 3) { S.lac = 1; S.glu = f.local < 0.5 ? 0 : 1; S.mu = 'wt'; } if (i === 4) { S.lac = 0; S.glu = 0; S.mu = f.local < 0.5 ? 'laci' : 'laco'; } }
      var b = bound(), v = lvl() / 100, th = ctx.now, on = ctx.layer('prod');
      var blocked = b > 0.5;
      rep.position.set(blocked ? X.O : X.I + 1.5 + Math.sin(th) * 0.5, blocked ? 1.1 : 3.2 + Math.cos(th * 0.8) * 0.4, 0); rep.visible = S.mu !== 'laci';
      rep.material.color.setHex(S.lac ? 0xd0bfff : 0x9775fa);
      gene.O.material.color.setHex(S.mu === 'laco' ? 0x7a0000 : 0xff6b6b);
      var u = (th * 0.25) % 1; var run = v > 0.3;
      pol.position.set(run ? X.P + 1 + u * (X.A + 1 - X.P - 1) : X.P - 0.3, run ? 1.3 : 2.3 + Math.sin(th) * 0.2, 0); pol.scale.setScalar(run ? 1 : 0.8);
      cap.visible = !S.glu; cap.position.set(X.P - 1.5, 1.2, 0);
      mr.forEach(function (m, j) { m.visible = on && j < Math.round(v * 6); m.position.set(X.P + 1 + j * 1.8, -1.4 - (j % 2) * 0.4, 0); });
      en.forEach(function (e, j) { e.visible = on && j < Math.round(v * 9); e.position.set(X.Z + (j % 5) * 1.3 - 1, -3 - Math.floor(j / 5) * 0.9, 0); });
      lab[0].pos(X.I, 1.7, 0).set('lacI', 'bl-d').vis(true); lab[1].pos(X.P, 1.7, 0).set('P', 'bl-d').vis(true); lab[2].pos(X.O, 3.2, 0).set('O', 'bl-d').vis(true);
      lab[3].pos(X.Z, 1.7, 0).set('lacZ', 'bl-d').vis(true); lab[4].pos(X.Y, 1.7, 0).set('lacY', 'bl-d').vis(true); lab[5].pos(X.A, 1.7, 0).set('lacA', 'bl-d').vis(true);
      lab[6].pos(21, 6.4, 0).set((S.mu === 'wt' ? (S.lac ? 'Con lactosa' : 'Sin lactosa') : MU[S.mu]) + ' · ' + (S.glu ? 'con glucosa' : 'sin glucosa'), 'bl-lead').vis(true);
      lab[7].pos(21, -5.2, 0).set('Expresión: ' + fmt(v * 100, 0) + ' % del máximo', v > 0.5 ? 'bl-pos' : 'bl-neg').vis(true);
      lab[8].pos(X.I + 1.5, 4.8, 0).set(S.mu === 'laci' ? 'sin represor funcional' : 'represor', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.lac) u.lac.set(S.lac); if (u.glu) u.glu.set(S.glu); if (u.mu) u.mu.set(S.mu); },
    hud: function () { return { eq: { chip: 'lac', name: 'Regulación', body: '<div class="eqline"><small>Represor en O</small>' + fmt(bound() * 100, 0) + ' %</div><div class="eqline"><small>CAP–AMPc</small>' + (S.glu ? 'inactivo' : 'activo') + '</div><div class="eqline"><small>Expresión</small>' + fmt(lvl(), 0) + ' %</div>' }, legend: [{ label: 'Esfera morada', color: '#9775fa', text: 'represor LacI' }, { label: 'Esfera azul', color: '#4dabf7', text: 'ARN polimerasa' }, { label: 'Octaedro', color: '#ffd43b', text: 'CAP–AMPc' }] }; },
    measures: function () { return [['Cepa', MU[S.mu]], ['Lactosa', S.lac ? 'presente' : 'ausente'], ['Glucosa', S.glu ? 'presente' : 'ausente'], ['Represor unido a O', fmt(bound() * 100, 0) + ' %'], ['CAP–AMPc', S.glu ? 'inactivo' : 'activo'], ['β-galactosidasa', fmt(lvl(), 0) + ' %']]; },
    ideas: ['Sin lactosa: represor en O.', 'Alolactosa libera al represor.', 'Glucosa → AMPc bajo → CAP inactivo.', 'lacI⁻ y lacOᶜ: expresión constitutiva.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Condiciones de cultivo'); el.appendChild(c);
      ui.lac = kit.ui.options({ label: 'Lactosa', cols: 2, value: S.lac, options: [{ v: 0, label: 'Ausente' }, { v: 1, label: 'Presente' }], onChange: function (v) { ctx.goManual(); S.lac = +v; } });
      ui.glu = kit.ui.options({ label: 'Glucosa', cols: 2, value: S.glu, options: [{ v: 0, label: 'Ausente' }, { v: 1, label: 'Presente' }], onChange: function (v) { ctx.goManual(); S.glu = +v; } });
      ui.mu = kit.ui.options({ label: 'Cepa', cols: 1, value: S.mu, options: Object.keys(MU).map(function (k) { return { v: k, label: MU[k] }; }), onChange: function (v) { ctx.goManual(); S.mu = v; } });
      c.appendChild(ui.lac); c.appendChild(ui.glu); c.appendChild(ui.mu); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Expresión en las cuatro condiciones', h: 210, note: 'Cepa silvestre: nivel relativo de β-galactosidasa.', draw: function (cx, w, h, col) {
      var d = [['−lac −glu', 0, 0], ['+lac −glu', 1, 0], ['+lac +glu', 1, 1], ['−lac +glu', 0, 1]], L = 10, B = 28, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / 4; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var v = expr(x[1], x[2], 'wt'), hh = ph * v / 100, cur = (S.mu === 'wt' && S.lac === x[1] && S.glu === x[2]); cx.fillStyle = cur ? '#ff922b' : '#69db7c'; cx.fillRect(L + j * bw + 6, Tp + ph - hh, bw - 12, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(fmt(v, 0) + ' %', L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, c4 = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (x) { return (x[0] ? '+' : '−') + 'lac ' + (x[1] ? '+' : '−') + 'glu: <b>' + fmt(expr(x[0], x[1], 'wt'), 0) + ' %</b>'; }).join('<br>'); return '<div class="card-kicker">' + MU[S.mu] + '</div><table class="calc-table">' + row('Fracción del operador ocupada', '<b>' + fmt(bound() * 100, 0) + ' %</b>') + row('Activación por CAP', '<b>' + fmt(capAct() * 100, 0) + ' %</b> (factor 0,1 + 0,9·CAP)') + row('Expresión', '(1 − ocupación) × activación = <b>' + fmt(lvl(), 0) + ' %</b>') + row('Silvestre, 4 condiciones', c4) + '</table>'; },
    quiz: [
      { q: 'Sin lactosa, el represor LacI…', options: ['se une al operador y bloquea la transcripción', 'se une al promotor y la activa', 'se degrada', 'se une a CAP'], answer: 0, why: 'Control negativo.' },
      { q: 'El inductor real del operón lac es…', options: ['la alolactosa', 'la glucosa', 'el AMPc', 'la β-galactosidasa'], answer: 0, why: 'Se une al represor y lo libera.' },
      { q: 'Con lactosa y glucosa, la expresión es…', options: ['baja', 'máxima', 'nula siempre', 'igual a sin lactosa y sin glucosa'], answer: 0, why: 'Represión catabólica: CAP inactivo.' },
      { q: 'Un mutante lacOᶜ…', options: ['se expresa sin lactosa', 'nunca se expresa', 'no tiene lacZ', 'produce más represor'], answer: 0, why: 'El represor no reconoce el operador.' },
      { q: 'El gen lacZ codifica…', options: ['β-galactosidasa', 'permeasa', 'el represor', 'CAP'], answer: 0, why: 'Hidroliza lactosa a glucosa y galactosa.' },
      { q: 'CAP–AMPc actúa como…', options: ['activador (control positivo)', 'represor', 'inductor', 'operador'], answer: 0, why: 'Ayuda a reclutar la ARN polimerasa.' }
    ],
    help: { intro: 'Elige lactosa, glucosa y cepa. Verás si el represor bloquea el operador, si la polimerasa avanza y cuánto ARNm y enzima se forman.', items: [['Componentes', 'esfera morada = represor LacI; esfera azul = ARN polimerasa; octaedro = CAP–AMPc.'], ['Producción', 'en la parte inferior se acumulan el ARNm y las enzimas (β-galactosidasa) cuando el operón se transcribe.'], ['Controles', '«Lactosa» y «Glucosa» (ausente o presente) y «Cepa»: silvestre o mutantes lacI⁻ y lacOᶜ.'], ['Gráfico', '«Expresión en las cuatro condiciones» de lactosa y glucosa.']], try: ['Sin lactosa, el represor queda en el operador y no se forma ARNm.', 'Con lactosa y sin glucosa la expresión es máxima; agrega glucosa y baja (AMPc bajo, CAP inactivo).', 'Elige un mutante lacI⁻ o lacOᶜ: hay expresión aunque no haya lactosa (constitutiva).'] }
  };
  MSim.create(def);
})();
