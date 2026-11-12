/* Fármacos y receptores — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var LG = { ag: { n: 'Agonista completo', e: 1, c: 0x40c057 }, pa: { n: 'Agonista parcial', e: 0.4, c: 0xfab005 }, an: { n: 'Antagonista', e: 0, c: 0xfa5252 } };
  var DR = { asp: { n: 'Aspirina', mw: 180, lp: 1.2, hd: 1, ha: 4 }, ibu: { n: 'Ibuprofeno', mw: 206, lp: 3.5, hd: 1, ha: 2 }, par: { n: 'Paracetamol', mw: 151, lp: 0.5, hd: 2, ha: 2 }, ato: { n: 'Atorvastatina', mw: 559, lp: 5.7, hd: 4, ha: 7 }, cic: { n: 'Ciclosporina', mw: 1203, lp: 3, hd: 5, ha: 12 } };
  var S = { lg: 'ag', logL: -7, logKd: -7, antag: false, logB: -7, logKb: -8, dr: 'asp', mode: 'rec' }, g = null, lab = [], recs = [], lig = [], rnd = [], drs = [];
  function occ(L, Kd, B, Kb) { return L / (L + Kd * (1 + B / Kb)); }
  function resp(logL, e, withB) { var L = Math.pow(10, logL), Kd = Math.pow(10, S.logKd), B = withB ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb); return e * occ(L, Kd, B, Kb); }
  function lip(d) { var v = (d.mw > 500 ? 1 : 0) + (d.lp > 5 ? 1 : 0) + (d.hd > 5 ? 1 : 0) + (d.ha > 10 ? 1 : 0); return v; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ['Receptores y ligandos', 'Receptor', 'Un fármaco se une reversiblemente a su receptor: ocupación = [L]/([L] + Kd)',
        '<p>Un <b>receptor</b> es una proteína (en la membrana o el interior celular) que reconoce a un <b>ligando</b> con alta afinidad y especificidad. La unión es reversible, L + R ⇌ LR, con constante de disociación <b>K<sub>d</sub> = [L][R]/[LR]</b>: cuanto menor K<sub>d</sub>, mayor afinidad. La fracción de receptores ocupados es <b>[L]/([L] + K<sub>d</sub>)</b>: al 50 % cuando [L] = K<sub>d</sub>.</p>'],
      ['Agonistas, parciales y antagonistas', 'Eficacia', 'La eficacia (e) distingue lo que hace el fármaco una vez unido',
        '<p>La <b>afinidad</b> es la capacidad de unirse; la <b>eficacia</b> es la capacidad de <b>activar</b> el receptor. El <b>agonista completo</b> (e = 1) produce la respuesta máxima; el <b>parcial</b> (0 &lt; e &lt; 1) produce una respuesta menor aun ocupando todos los receptores; el <b>antagonista</b> (e = 0) se une sin activar y <b>bloquea</b> al agonista. Cambia el tipo de ligando y fíjate en los receptores iluminados.</p>'],
      ['Curva dosis–respuesta', 'Dosis–respuesta', 'Respuesta frente a log[L]: sigmoidea con EC₅₀ en el punto medio',
        '<p>La <b>curva dosis–respuesta</b> (respuesta frente a log [L]) es una sigmoide. La <b>EC<sub>50</sub></b> es la concentración que produce el 50 % del efecto máximo, y mide la <b>potencia</b>; el <b>E<sub>máx</sub></b> mide la eficacia. Un agonista parcial tiene menor E<sub>máx</sub>. Con modelo simple (sin amplificación), EC<sub>50</sub> = K<sub>d</sub>.</p>'],
      ['Antagonismo competitivo', 'Antagonista', 'El antagonista desplaza la curva a la derecha sin reducir el Emáx',
        '<p>Un <b>antagonista competitivo</b> compite por el mismo sitio. Disminuye la ocupación por el agonista: <b>[A]/([A] + K<sub>d</sub>(1 + [B]/K<sub>b</sub>))</b>. La curva se <b>desplaza a la derecha</b> (aumenta la EC<sub>50</sub>) pero <b>conserva el E<sub>máx</sub></b>: se vence con más agonista. El desplazamiento (cociente de dosis) es <b>1 + [B]/K<sub>b</sub></b> (análisis de Schild).</p>'],
      ['De la molécula al medicamento', 'Lipinski', 'Reglas de Lipinski: PM ≤ 500 · logP ≤ 5 · dador H ≤ 5 · aceptor H ≤ 10',
        '<p>Para que un fármaco se absorba por <b>vía oral</b>, conviene cumplir la <b>regla de los cinco de Lipinski</b>: masa molar ≤ 500 g/mol, logP ≤ 5, ≤ 5 donadores de enlace de H y ≤ 10 aceptores. Más de una infracción predice mala absorción o permeabilidad. Hay excepciones (ciclosporina, productos naturales). Elige un fármaco y compara sus propiedades.</p>']
    ];
  }
  var def = {
    key: 'farmacos-receptores', title: 'Fármacos y receptores', subtitle: 'Simulador 3D · bioquímica y farmacología', accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 10, 18], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 2, 22], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 24, 2], target: [0, 0, 0] }],
    layers: [{ id: 'lig', label: 'Ligandos', icon: '●' }, { id: 'act', label: 'Receptores activos', icon: '✦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      var mb = new T.Mesh(new T.BoxGeometry(22, 0.6, 14), new T.MeshStandardMaterial({ color: 0x9775fa, transparent: true, opacity: 0.45 })); mb.position.y = -1; g.add(mb);
      var seed = 7; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (i = 0; i < 40; i++) { var rc = new T.Mesh(new T.CylinderGeometry(0.55, 0.45, 2.2, 10), new T.MeshStandardMaterial({ color: 0x74c0fc, roughness: 0.5, emissive: 0x000000 })); rc.position.set(-9.5 + (i % 10) * 2.1, 0.2, -5 + Math.floor(i / 10) * 3.3 + (i % 2) * 0.4); g.add(rc); recs.push(rc); var lg = new T.Mesh(new T.SphereGeometry(0.45, 12, 8), new T.MeshStandardMaterial({ color: 0x40c057 })); lg.position.copy(rc.position).add(new T.Vector3(0, 1.5, 0)); g.add(lg); lig.push(lg); rnd.push([r(), r()]); }
      for (i = 0; i < 5; i++) { var bar = new T.Mesh(new T.BoxGeometry(1.6, 1, 1.6), new T.MeshStandardMaterial({ color: 0x4dabf7 })); bar.visible = false; g.add(bar); drs.push(bar); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 4 ? 'lip' : 'rec'; if (i === 0) { S.lg = 'ag'; S.antag = false; S.logL = -9 + 4 * Math.min(1, f.local * 1.1); } if (i === 1) { S.lg = ['ag', 'pa', 'an'][Math.min(2, Math.floor(f.local * 3))]; S.logL = -5.5; S.antag = false; } if (i === 2) { S.lg = 'ag'; S.logL = -9 + 5 * f.local; S.antag = false; } if (i === 3) { S.lg = 'ag'; S.antag = true; S.logL = -9 + 5 * f.local; } if (i === 4) S.dr = Object.keys(DR)[Math.min(4, Math.floor(f.local * 5))]; }
      lab.forEach(function (l) { l.vis(false); }); drs.forEach(function (b) { b.visible = false; });
      var lOn = ctx.layer('lig'), aOn = ctx.layer('act');
      if (S.mode === 'lip') {
        recs.forEach(function (r) { r.visible = false; }); lig.forEach(function (l) { l.visible = false; }); var d = DR[S.dr], vals = [d.mw / 500, d.lp / 5, d.hd / 5, d.ha / 10], names = ['PM ≤ 500', 'logP ≤ 5', 'HBD ≤ 5', 'HBA ≤ 10'];
        vals.forEach(function (v, j) { var b = drs[j]; b.visible = true; var hh = Math.max(0.2, v * 6); b.scale.y = hh; b.position.set(-7.5 + j * 5, hh / 2 - 1, 0); b.material.color.setHex(v > 1 ? 0xfa5252 : 0x40c057); lab[j].pos(-7.5 + j * 5, -2.6, 0).set(names[j], 'bl-d').vis(true); });
        lab[4].pos(0, 8.6, 0).set(d.n + ' · infracciones: ' + lip(d), lip(d) > 1 ? 'bl-neg' : 'bl-pos').vis(true); lab[5].pos(0, -4.4, 0).set('altura = valor / límite (1 = límite de Lipinski)', 'bl-d').vis(true); return;
      }
      var e = LG[S.lg].e, L = Math.pow(10, S.logL), Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), oL = L / (L + Kd * (1 + B / Kb)), oB = (S.antag ? (B / Kb) / (1 + B / Kb + L / Kd) : 0) * 1, tot = 1 + L / Kd + B / Kb; oB = (B / Kb) / tot; oL = (L / Kd) / tot;
      var nL = 0, nB = 0, nA = 0;
      recs.forEach(function (r, j) { var u = rnd[j][0], v = rnd[j][1], state = u < oL ? 'L' : (u < oL + oB ? 'B' : 'F'), act = state === 'L' && v < e; lig[j].visible = lOn && state !== 'F'; lig[j].material.color.setHex(state === 'L' ? LG[S.lg].c : 0xfa5252); lig[j].position.y = 1.5 + 0.1 * Math.sin(now * 2 + j); r.material.emissive.setHex(act && aOn ? 0xfab005 : 0x000000); r.material.emissiveIntensity = 0.8; r.visible = true; if (state === 'L') nL++; if (state === 'B') nB++; if (act) nA++; });
      lab[0].pos(0, 6.6, 0).set(LG[S.lg].n + ' · [L] = ' + (L < 1e-6 ? fmt(L * 1e9, 1) + ' nM' : fmt(L * 1e6, 2) + ' µM'), 'bl-lead').vis(true);
      lab[1].pos(0, -4.6, 0).set('ocupación ' + fmt(oL * 100, 0) + ' % · respuesta ' + fmt(e * oL * 100, 0) + ' % del máximo' + (S.antag ? ' · antagonista ocupa ' + fmt(oB * 100, 0) + ' %' : ''), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.lg) u.lg.set(S.lg); if (u.L) u.L.set(S.logL); if (u.dr) u.dr.set(S.dr); },
    hud: function () { var L = Math.pow(10, S.logL), Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), o = L / (L + Kd * (1 + B / Kb)), e = LG[S.lg].e; return { eq: { chip: fmt(o * 100, 0) + '%', name: LG[S.lg].n, body: '<div class="eqline"><small>Ocupación</small>' + fmt(o * 100, 1) + ' %</div><div class="eqline"><small>Eficacia e</small>' + fmt(e, 1) + '</div><div class="eqline"><small>Respuesta</small>' + fmt(e * o * 100, 1) + ' %</div><div class="eqline"><small>EC₅₀ aparente</small>' + fmt(Kd * (1 + B / Kb) * 1e9, 1) + ' nM</div>' }, legend: [{ label: 'Verde', color: '#40c057', text: 'agonista unido' }, { label: 'Rojo', color: '#fa5252', text: 'antagonista unido' }, { label: 'Receptor amarillo', color: '#fab005', text: 'receptor activado' }] }; },
    measures: function () { var Kd = Math.pow(10, S.logKd), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb); return [['Ligando', LG[S.lg].n], ['Kd', fmt(Kd * 1e9, 1) + ' nM'], ['log[L]', fmt(S.logL, 1)], ['Antagonista', S.antag ? fmt(B * 1e9, 1) + ' nM (Kb ' + fmt(Kb * 1e9, 1) + ' nM)' : 'ausente'], ['Cociente de dosis', fmt(1 + B / Kb, 2)]]; },
    ideas: ['Ocupación = [L]/([L] + Kd).', 'Afinidad ≠ eficacia.', 'Antagonista competitivo: curva a la derecha, mismo Emáx.', 'Lipinski: ≤ 1 infracción para vía oral.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Ligando'); el.appendChild(c);
      ui.lg = kit.ui.options({ label: 'Tipo', cols: 1, value: S.lg, options: Object.keys(LG).map(function (k) { return { v: k, label: LG[k].n, sub: 'e = ' + LG[k].e }; }), onChange: function (v) { ctx.goManual(); S.mode = 'rec'; S.lg = v; } }); c.appendChild(ui.lg);
      ui.L = kit.ui.slider({ label: 'log [L] (M)', min: -10, max: -3, step: 0.1, value: S.logL, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.mode = 'rec'; S.logL = v; } });
      var sk = kit.ui.slider({ label: 'log Kd (M)', min: -9, max: -5, step: 0.1, value: S.logKd, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.logKd = v; } });
      var sb = kit.ui.slider({ label: 'log [antagonista] (M)', min: -10, max: -4, step: 0.1, value: S.logB, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.antag = true; S.logB = v; } });
      c.appendChild(kit.ui.sliders([ui.L, sk, sb]));
      c.appendChild(ctx.btnRow([{ t: 'Antagonista: sí/no', fn: function () { ctx.goManual(); S.antag = !S.antag; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var d = kit.ui.card('Lipinski'); el.appendChild(d); ui.dr = kit.ui.options({ label: 'Fármaco', cols: 2, value: S.dr, options: Object.keys(DR).map(function (k) { return { v: k, label: DR[k].n }; }), onChange: function (v) { ctx.goManual(); S.mode = 'lip'; S.dr = v; } }); d.appendChild(ui.dr);
    },
    graphs: [
      { title: 'Curva dosis–respuesta', h: 250, note: 'Línea verde: agonista solo. Línea roja: con antagonista (desplazada). Punto: tu dosis.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, e = LG[S.lg].e; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = -10; i <= -3; i++) cx.fillText(i, L + pw * (i + 10) / 7, h - B + 14); cx.fillText('log [L]', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(i * 25 + '%', L - 4, Tp + ph * (1 - i / 4) + 3);
        function crv(withB, color) { cx.strokeStyle = color; cx.lineWidth = 2; cx.beginPath(); for (var k = 0; k <= 100; k++) { var lg = -10 + 7 * k / 100; (k ? cx.lineTo : cx.moveTo).call(cx, L + pw * (lg + 10) / 7, Tp + ph * (1 - resp(lg, Math.max(e, 0.001), withB))); } cx.stroke(); }
        crv(false, '#40c057'); if (S.antag) crv(true, '#fa5252'); cx.lineWidth = 1;
        var rr = resp(S.logL, e, S.antag); cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.logL + 10) / 7, Tp + ph * (1 - rr), 5, 0, 6.28); cx.fill();
        cx.strokeStyle = col.muted; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - e / 2)); cx.lineTo(L + pw, Tp + ph * (1 - e / 2)); cx.stroke(); cx.setLineDash([]);
      } },
      { title: 'Regla de Lipinski', h: 220, note: 'Barras: valor del fármaco / límite. Rojo = excede el límite.', draw: function (cx, w, h, col) {
        var d = DR[S.dr], D = [['PM', d.mw / 500, d.mw + ' g/mol'], ['logP', d.lp / 5, fmt(d.lp, 1)], ['Donadores H', d.hd / 5, String(d.hd)], ['Aceptores H', d.ha / 10, String(d.ha)]], L = 88, Rr = 50, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / 4; cx.font = '10px system-ui';
        D.forEach(function (a, j) { var y = Tp + j * bh, v = Math.min(2.4, a[1]); cx.fillStyle = a[1] > 1 ? '#fa5252' : '#40c057'; cx.fillRect(L, y + 5, pw * v / 2.4, bh - 10); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(a[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(a[2], L + pw * v / 2.4 + 4, y + bh / 2 + 3); });
        cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw / 2.4, Tp); cx.lineTo(L + pw / 2.4, h - B); cx.stroke(); cx.setLineDash([]);
      } }
    ],
    calc: function () { var Kd = Math.pow(10, S.logKd), L = Math.pow(10, S.logL), B = S.antag ? Math.pow(10, S.logB) : 0, Kb = Math.pow(10, S.logKb), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'lip') { var d = DR[S.dr]; return '<div class="card-kicker">' + d.n + '</div><table class="calc-table">' + row('Masa molar', d.mw + ' g/mol ' + (d.mw > 500 ? '✗' : '✓')) + row('logP', fmt(d.lp, 1) + (d.lp > 5 ? ' ✗' : ' ✓')) + row('Donadores H', d.hd + (d.hd > 5 ? ' ✗' : ' ✓')) + row('Aceptores H', d.ha + (d.ha > 10 ? ' ✗' : ' ✓')) + row('Infracciones', '<b>' + lip(d) + '</b> → ' + (lip(d) > 1 ? 'probable mala absorción oral' : 'buen candidato oral')) + '</table>'; } var o = L / (L + Kd * (1 + B / Kb)); return '<div class="card-kicker">Ocupación</div><table class="calc-table">' + row('[L]', fmt(L * 1e9, 2) + ' nM') + row('Kd', fmt(Kd * 1e9, 2) + ' nM') + row('Factor 1 + [B]/Kb', fmt(1 + B / Kb, 2)) + row('Ocupación', '[L]/([L] + Kd·f) = <b>' + fmt(o * 100, 1) + ' %</b>') + row('Respuesta = e × ocupación', fmt(LG[S.lg].e, 1) + ' × ' + fmt(o, 3) + ' = <b>' + fmt(LG[S.lg].e * o * 100, 1) + ' %</b>') + row('EC₅₀ aparente', fmt(Kd * (1 + B / Kb) * 1e9, 1) + ' nM') + '</table>'; },
    quiz: [
      { q: 'Si [L] = Kd, la ocupación es…', options: ['50 %', '100 %', '10 %', '0 %'], answer: 0, why: '[L]/([L] + Kd) = ½.' },
      { q: 'Un antagonista tiene eficacia…', options: ['cero', 'uno', 'mayor que uno', 'negativa siempre'], answer: 0, why: 'Se une sin activar.' },
      { q: 'El antagonista competitivo desplaza la curva…', options: ['a la derecha, con el mismo Emáx', 'a la izquierda', 'reduce el Emáx', 'no cambia'], answer: 0, why: 'Aumenta la EC₅₀.' },
      { q: 'Un agonista parcial…', options: ['no alcanza el Emáx del completo', 'siempre bloquea', 'tiene Kd = 0', 'no se une'], answer: 0, why: 'e < 1.' },
      { q: 'La regla de Lipinski fija como máximo de masa molar…', options: ['500 g/mol', '1000 g/mol', '150 g/mol', '5000 g/mol'], answer: 0, why: 'Para absorción oral.' }
    ],
    help: { intro: 'Cada cilindro es un receptor; las esferas verdes son agonistas unidos y las rojas, antagonistas. Un receptor amarillo está activado. En «Lipinski» ves las cuatro propiedades de un fármaco.', items: [['Receptores', 'cada cilindro es un receptor y se pone amarillo cuando está activado; la proporción de receptores amarillos refleja la respuesta.'], ['Ligandos', 'esferas verdes = agonista unido; esferas rojas = antagonista unido (ocupa el receptor sin activarlo).'], ['Controles de «Lab»', '«Tipo» elige el ligando (agonista completo, parcial o antagonista); «log [L]» y «log Kd» fijan la ocupación = [L]/([L] + Kd); «log [antagonista]» añade un competidor; «Fármaco» elige el compuesto para Lipinski.'], ['Gráficos', '«Curva dosis–respuesta» (respuesta frente a log [L]) y «Regla de Lipinski», que compara las propiedades del fármaco con los límites para la vía oral.']], try: ['Pon log [L] igual a log Kd: la ocupación debe quedar en 50 %.', 'Agrega antagonista: la curva dosis–respuesta se desplaza a la derecha, pero alcanza el mismo Emáx.', 'Cambia a agonista parcial: aunque ocupe todos los receptores, no llega al Emáx del agonista completo.'] }
  };
  MSim.create(def);
})();
