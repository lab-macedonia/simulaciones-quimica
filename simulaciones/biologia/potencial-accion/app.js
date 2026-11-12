/* Potencial de membrana y potencial de acción — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, NS = 16, DLY = 3;
  var S = { ko: 5, ki: 140, nao: 145, nai: 15, pr: 0.04, I: 15, blk: 'none', auto: 1, t: 0, dl: 6, pulse: 0 };
  var X = { V: -65, m: 0.053, h: 0.596, n: 0.318 }, H = [], g = null, seg = [], na = [], kk = [], lab = [], acc = 0, simT = 0, fired = [0, 0], I0 = 0;
  function nern(o, i) { return 61.5 * Math.log(o / i) / Math.LN10; }
  function EK() { return nern(S.ko, S.ki); } function ENa() { return nern(S.nao, S.nai); }
  function gold() { return 61.5 * Math.log((S.ko + S.pr * S.nao) / (S.ki + S.pr * S.nai)) / Math.LN10; }
  function vt(x, y) { return Math.abs(x / y) < 1e-6 ? y : x / (1 - Math.exp(-x / y)); }
  function gNa() { return 120 * (S.blk === 'ttx' ? 0 : 1); } function gK() { return 36 * (S.blk === 'tea' ? 0 : 1); }
  function step(dt) {
    var V = X.V, am = 0.1 * vt(V + 40, 10), bm = 4 * Math.exp(-(V + 65) / 18), ah = 0.07 * Math.exp(-(V + 65) / 20), bh = 1 / (1 + Math.exp(-(V + 35) / 10)), an = 0.01 * vt(V + 55, 10), bn = 0.125 * Math.exp(-(V + 65) / 80);
    var I = S.pulse > 0 ? S.I : 0; if (S.pulse > 0) S.pulse -= dt;
    X.m += dt * (am * (1 - X.m) - bm * X.m); X.h += dt * (ah * (1 - X.h) - bh * X.h); X.n += dt * (an * (1 - X.n) - bn * X.n);
    X.V += dt * (I - gNa() * Math.pow(X.m, 3) * X.h * (V - ENa()) - gK() * Math.pow(X.n, 4) * (V - EK()) - 0.3 * (V + 54.4));
  }
  function advance(ms) { var k = Math.round(ms / 0.01), j; for (j = 0; j < k; j++) { step(0.01); simT += 0.01; if (j % 10 === 0) { H.push([X.V, X.m, X.h, X.n]); if (H.length > 600) H.shift(); } } }
  function stages() {
    return [
      ['Potencial de equilibrio (Nernst)', 'Nernst', 'E = 61,5 mV · log([ion]ext/[ion]int)',
        '<p>Una membrana con canales selectivos a un ion alcanza un <b>potencial de equilibrio</b> cuando el gradiente químico se compensa con el eléctrico: <b>E = (RT/zF)·ln([ion]ext/[ion]int)</b>, ≈ 61,5·log₁₀(ext/int) mV a 37 °C para un catión monovalente. Con K⁺ 5 mM fuera y 140 mM dentro, E<sub>K</sub> ≈ −77 mV; para Na⁺ (145/15 mM), E<sub>Na</sub> ≈ +60 mV.</p>'],
      ['Potencial de reposo (Goldman)', 'Reposo', 'Vm depende de la permeabilidad relativa de cada ion',
        '<p>La neurona en reposo es permeable sobre todo a K⁺ y muy poco a Na⁺. La ecuación de <b>Goldman</b> pondera cada ion por su permeabilidad: <b>V<sub>m</sub> = 61,5·log[(P<sub>K</sub>[K]<sub>e</sub> + P<sub>Na</sub>[Na]<sub>e</sub>)/(P<sub>K</sub>[K]<sub>i</sub> + P<sub>Na</sub>[Na]<sub>i</sub>)]</b>. Con P<sub>Na</sub>/P<sub>K</sub> = 0,04 el reposo queda cerca de −65 mV. Cambia [K⁺] externo y la permeabilidad.</p>'],
      ['Potencial de acción', 'Disparo', 'Despolarización (Na⁺ entra) → repolarización (K⁺ sale)',
        '<p>Un estímulo despolariza la membrana; al pasar el <b>umbral</b> (~−55 mV) se abren los <b>canales de Na⁺ dependientes de voltaje</b>: entra Na⁺ y el voltaje sube hacia E<sub>Na</sub> (<b>despolarización</b>). Luego los canales de Na⁺ se <b>inactivan</b> y se abren los de K⁺: sale K⁺ (<b>repolarización</b>), con una breve <b>hiperpolarización</b>. Es una respuesta <b>todo o nada</b> que se propaga por el axón.</p>'],
      ['Umbral y periodo refractario', 'Refractario', 'Tras un disparo, los canales de Na⁺ están inactivos: no se puede disparar de nuevo',
        '<p>Durante el <b>periodo refractario absoluto</b> los canales de Na⁺ están inactivados y ningún estímulo dispara otro potencial; en el <b>relativo</b> hace falta un estímulo mayor. Esto limita la frecuencia de disparo y hace que el impulso viaje en un solo sentido. Observa un segundo estímulo cada vez más tardío.</p>'],
      ['Bloqueadores: TTX y TEA', 'Bloqueadores', 'TTX bloquea los canales de Na⁺; TEA bloquea los de K⁺',
        '<p>La <b>tetrodotoxina (TTX)</b> bloquea los canales de Na⁺ dependientes de voltaje: no hay fase de subida y desaparece el potencial de acción. El <b>tetraetilamonio (TEA)</b> bloquea los de K⁺: la repolarización se enlentece y el potencial se prolonga. Compara ambas condiciones.</p>']
    ];
  }
  var def = {
    key: 'potencial-accion', title: 'Potencial de membrana y potencial de acción', subtitle: 'Simulador 3D · biología', accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 5, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [16, 6, 20], target: [16, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [16, 2, 24], target: [16, 0, 0] }],
    layers: [{ id: 'ch', label: 'Canales', icon: '▮' }],
    build: function (ctx) {
      g = new T.Group(); g.position.x = 1.5; ctx.scene.add(g); var i;
      for (i = 0; i < NS; i++) {
        var r = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 1.1, 22, 1, true), new T.MeshStandardMaterial({ color: 0x4dabf7, side: T.DoubleSide, transparent: true, opacity: 0.85 })); r.rotation.z = Math.PI / 2; r.position.set(8 + i * 1.2, 0, 0); g.add(r); seg.push(r);
        var a = new T.Mesh(new T.BoxGeometry(0.35, 1, 0.35), new T.MeshStandardMaterial({ color: 0xff6b6b })); a.position.set(8 + i * 1.2, 1.7, 0.5); g.add(a); na.push(a);
        var k = new T.Mesh(new T.BoxGeometry(0.35, 1, 0.35), new T.MeshStandardMaterial({ color: 0x4263eb })); k.position.set(8 + i * 1.2, 1.7, -0.5); g.add(k); kk.push(k);
      }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k, st = P.manual ? -1 : i, d = Math.min(dt || 0.016, 0.05);
      if (!P.manual) {
        if (i === 0) { S.ko = 2 + 18 * f.local; S.blk = 'none'; S.pr = 0.04; } else if (i === 1) { S.ko = 5; S.pr = 0.01 + 0.19 * f.local; S.blk = 'none'; } else { S.ko = 5; S.pr = 0.04; }
        if (i === 2) { S.blk = 'none'; S.I = 15; } if (i === 3) { S.blk = 'none'; S.dl = 3 + 12 * f.local; } if (i === 4) { S.blk = f.local < 0.5 ? 'ttx' : 'tea'; }
        if (i >= 2) { var per = 50; S.t += d * 8; var c = S.t % per; if (i === 3) { if (c < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (c >= 0.4 && c < 20) { if (c > S.dl && !fired[1]) { S.pulse = 1; fired[1] = 1; } } if (c > 30) { fired = [0, 0]; } if (c < 0.4) fired[1] = 0; } else { if (c < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (c > 5) fired[0] = 0; } }
      } else if (S.auto) { S.t += d * 8; if (S.t % 50 < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (S.t % 50 > 5) fired[0] = 0; }
      advance(d * 8);
      var n = H.length, cur = H[n - 1] || [-65, 0.05, 0.6, 0.3], on = ctx.layer('ch');
      for (k = 0; k < NS; k++) {
        var idx = Math.max(0, n - 1 - k * DLY), s = H[idx] || cur, tv = Math.max(0, Math.min(1, (s[0] + 80) / 130));
        seg[k].material.color.set(0x4dabf7).lerp(new T.Color(0xff6b6b), tv); na[k].visible = kk[k].visible = on;
        var oN = Math.pow(s[1], 3) * s[2] * 3.5, oK = Math.pow(s[3], 4) * 1.5; na[k].scale.y = 0.2 + 2.2 * Math.min(1, oN); kk[k].scale.y = 0.2 + 2.2 * Math.min(1, oK); na[k].position.y = 1.4 + 0.5 * na[k].scale.y; kk[k].position.y = 1.4 + 0.5 * kk[k].scale.y;
      }
      var state = cur[0] > -55 && cur[1] > 0.3 ? 'despolarización' : (cur[0] < -68 ? 'hiperpolarización' : (cur[3] > 0.5 && cur[0] > -60 ? 'repolarización' : 'reposo'));
      lab[0].pos(17.5, 4.6, 0).set('V = ' + fmt(cur[0], 1) + ' mV · ' + state, cur[0] > -55 ? 'bl-neg' : 'bl-lead').vis(true);
      lab[1].pos(17.5, -3.2, 0).set('E(K⁺) = ' + fmt(EK(), 0) + ' mV · E(Na⁺) = ' + fmt(ENa(), 0) + ' mV', 'bl-d').vis(true);
      lab[2].pos(10.5, 3.6, 0).set('Na⁺', 'bl-neg').vis(on); lab[3].pos(24.5, 3.6, 0).set('K⁺', 'bl-pos').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; ['ko', 'ki', 'nao', 'nai', 'pr', 'I'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); if (u.blk) u.blk.set(S.blk); },
    hud: function () { var c = H[H.length - 1] || [-65, 0, 0, 0]; return { eq: { chip: 'Vm', name: 'Membrana', body: '<div class="eqline"><small>Vm</small>' + fmt(c[0], 1) + ' mV</div><div class="eqline"><small>Goldman (reposo)</small>' + fmt(gold(), 1) + ' mV</div><div class="eqline"><small>E K⁺ / Na⁺</small>' + fmt(EK(), 0) + ' / ' + fmt(ENa(), 0) + ' mV</div><div class="eqline"><small>Bloqueador</small>' + (S.blk === 'none' ? 'ninguno' : S.blk.toUpperCase()) + '</div>' }, legend: [{ label: 'Rojo', color: '#ff6b6b', text: 'canal de Na⁺ (altura = apertura)' }, { label: 'Azul', color: '#4263eb', text: 'canal de K⁺' }, { label: 'Anillo', color: '#4dabf7', text: 'voltaje local (azul → rojo)' }] }; },
    measures: function () { var c = H[H.length - 1] || [-65, 0, 0, 0]; return [['Vm', fmt(c[0], 1) + ' mV'], ['E K⁺ (Nernst)', fmt(EK(), 1) + ' mV'], ['E Na⁺ (Nernst)', fmt(ENa(), 1) + ' mV'], ['Reposo (Goldman)', fmt(gold(), 1) + ' mV'], ['gNa·m³h', fmt(gNa() * Math.pow(c[1], 3) * c[2], 1) + ' mS/cm²'], ['gK·n⁴', fmt(gK() * Math.pow(c[3], 4), 1) + ' mS/cm²']]; },
    ideas: ['Nernst: un solo ion.', 'Goldman: varios iones y permeabilidades.', 'Todo o nada sobre el umbral.', 'TTX bloquea Na⁺; TEA bloquea K⁺.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Iones y estímulo'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      var mM = function (v) { return fmt(v, 1) + ' mM'; };
      c.appendChild(kit.ui.sliders([sl('ko', '[K⁺] externo', 1, 25, 0.5, mM), sl('ki', '[K⁺] interno', 50, 200, 5, mM), sl('nao', '[Na⁺] externo', 100, 200, 5, mM), sl('nai', '[Na⁺] interno', 5, 50, 1, mM), sl('pr', 'P(Na)/P(K) en reposo', 0.01, 0.2, 0.01, function (v) { return fmt(v, 2); }), sl('I', 'Intensidad del estímulo', 0, 40, 1, function (v) { return v + ' µA/cm²'; })]));
      ui.blk = kit.ui.options({ label: 'Bloqueador', cols: 3, value: S.blk, options: [{ v: 'none', label: 'Ninguno' }, { v: 'ttx', label: 'TTX' }, { v: 'tea', label: 'TEA' }], onChange: function (v) { ctx.goManual(); S.blk = v; } }); c.appendChild(ui.blk);
      c.appendChild(ctx.btnRow([{ t: 'Estimular', fn: function () { ctx.goManual(); S.pulse = 1; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Potencial de membrana V(t)', h: 210, note: 'Últimos 60 ms. Líneas: umbral (−55 mV) y E(Na⁺).', draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, y = function (v) { return Tp + ph * (1 - (v + 90) / 160); }, i, n = Math.min(H.length, 600), s0 = H.length - 600;
      cx.strokeStyle = col.muted; cx.setLineDash && cx.setLineDash([3, 3]); [-55, ENa()].forEach(function (v) { cx.beginPath(); cx.moveTo(L, y(v)); cx.lineTo(L + pw, y(v)); cx.stroke(); }); cx.setLineDash && cx.setLineDash([]);
      cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i < H.length; i++) { var x = L + pw * (i + (600 - H.length)) / 600, yy = y(H[i][0]); i ? cx.lineTo(x, yy) : cx.moveTo(x, yy); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; [-80, -55, 0, 50].forEach(function (v) { cx.fillText(v, L - 4, y(v) + 3); }); cx.textAlign = 'center'; cx.fillText('−60 ms', L, h - 6); cx.fillText('ahora', L + pw, h - 6);
    } }, { title: 'Conductancias gNa y gK', h: 190, note: 'gNa(t) = ḡ·m³h (rojo) · gK(t) = ḡ·n⁴ (azul).', draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, i; [[1, '#ff6b6b'], [3, '#748ffc']].forEach(function (q) { cx.strokeStyle = q[1]; cx.lineWidth = 2; cx.beginPath(); H.forEach(function (s, i2) { var v = q[0] === 1 ? gNa() * Math.pow(s[1], 3) * s[2] : gK() * Math.pow(s[3], 4), x = L + pw * (i2 + (600 - H.length)) / 600, y = Tp + ph * (1 - Math.min(1, v / 40)); i2 ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); }); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillText('40', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph); cx.textAlign = 'center'; cx.fillText('mS/cm²', L + 10, h - 6);
    } }, { title: 'Reposo según [K⁺] externo (Goldman)', h: 190, note: 'Con la permeabilidad elegida; el punto marca tu [K⁺]e.', draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, i, y = function (v) { return Tp + ph * (1 - (v + 100) / 100); }; cx.strokeStyle = '#69db7c'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 48; i++) { var ko = 1 + i * 0.5, v = 61.5 * Math.log((ko + S.pr * S.nao) / (S.ki + S.pr * S.nai)) / Math.LN10; var x = L + pw * i / 48; i ? cx.lineTo(x, y(v)) : cx.moveTo(x, y(v)); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ko - 1) / 24, y(gold()), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('1 mM', L, h - 6); cx.fillText('25 mM', L + pw, h - 6); cx.textAlign = 'right'; cx.fillText('−100', L - 4, y(-100)); cx.fillText('0', L - 4, y(0) + 3);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">37 °C · iones monovalentes</div><table class="calc-table">' + row('E(K⁺)', '61,5·log(' + fmt(S.ko, 1) + ' / ' + fmt(S.ki, 0) + ') = <b>' + fmt(EK(), 1) + ' mV</b>') + row('E(Na⁺)', '61,5·log(' + fmt(S.nao, 0) + ' / ' + fmt(S.nai, 0) + ') = <b>' + fmt(ENa(), 1) + ' mV</b>') + row('Vm (Goldman)', '61,5·log[(' + fmt(S.ko, 1) + ' + ' + fmt(S.pr, 2) + '·' + fmt(S.nao, 0) + ') / (' + fmt(S.ki, 0) + ' + ' + fmt(S.pr, 2) + '·' + fmt(S.nai, 0) + ')] = <b>' + fmt(gold(), 1) + ' mV</b>') + row('Modelo', 'Hodgkin–Huxley simplificado (integración de Euler, dt = 0,01 ms)') + '</table>'; },
    quiz: [
      { q: 'Si aumenta la [K⁺] externa, E(K⁺) se vuelve…', options: ['menos negativo', 'más negativo', 'no cambia', 'positivo siempre'], answer: 0, why: 'E = 61,5·log(ext/int): sube.' },
      { q: 'La fase de subida del potencial de acción se debe a…', options: ['la entrada de Na⁺', 'la salida de K⁺', 'la entrada de Cl⁻', 'la bomba Na⁺/K⁺'], answer: 0, why: 'Canales de Na⁺ dependientes de voltaje.' },
      { q: 'La tetrodotoxina (TTX) bloquea…', options: ['canales de Na⁺', 'canales de K⁺', 'la bomba Na⁺/K⁺', 'canales de Ca²⁺ solamente'], answer: 0, why: 'Elimina la fase de despolarización.' },
      { q: 'En el periodo refractario absoluto…', options: ['los canales de Na⁺ están inactivados', 'los canales de K⁺ están cerrados', 'la membrana está en E(Na⁺)', 'la bomba se detiene'], answer: 0, why: 'No se puede generar otro potencial.' },
      { q: 'El potencial de reposo se acerca a E(K⁺) porque…', options: ['la membrana es mucho más permeable a K⁺', 'no hay Na⁺ fuera', 'el K⁺ es más pequeño que el Na⁺ siempre', 'la bomba lo fija en −70 mV'], answer: 0, why: 'Goldman pondera por permeabilidad.' },
      { q: 'Un estímulo subumbral produce…', options: ['una despolarización local sin potencial de acción', 'un potencial de acción pequeño', 'hiperpolarización', 'ningún cambio'], answer: 0, why: 'Es todo o nada.' }
    ],
    help: { intro: 'Cambia las concentraciones iónicas y observa Nernst y Goldman. Con «Estimular» disparas un potencial que viaja por el axón; elige TTX o TEA para ver su efecto.', items: [['Axón', 'barras rojas = canales de Na⁺ (su altura indica cuánto se abren) y azules = canales de K⁺; el anillo de color es el voltaje local (azul → rojo).'], ['Concentraciones', 'al cambiarlas, el panel recalcula el potencial de Nernst de cada ion y el de reposo (Goldman).'], ['«Estimular» y «Bloqueador»', 'disparan un potencial que viaja por el axón; TTX bloquea los canales de Na⁺ y TEA los de K⁺.'], ['Gráficos', '«Potencial de membrana V(t)», «Conductancias gNa y gK» y «Reposo según [K⁺] externo (Goldman)».']], try: ['Sube el K⁺ externo: el potencial de reposo se vuelve menos negativo.', 'Estimula y sigue V(t): la subida coincide con la apertura de los canales de Na⁺ y la bajada con los de K⁺.', 'Aplica TTX y estimula: sólo hay una despolarización local, sin potencial de acción.'] }
  };
  MSim.create(def);
})();
