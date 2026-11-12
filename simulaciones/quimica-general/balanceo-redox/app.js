/* Balanceo redox: método ion-electrón — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var R = {
    mn_fe: { n: 'MnO₄⁻ + Fe²⁺ (medio ácido)', med: 'ácido', un: 'MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺', ox: 'Fe²⁺', oxs: ['+2', '+3'], oxe: 'Fe', rd: 'MnO₄⁻', rds: ['+7', '+2'], rde: 'Mn',
      oxSk: 'Fe²⁺ → Fe³⁺', rdSk: 'MnO₄⁻ → Mn²⁺', rdAt: 'MnO₄⁻ + 8 H⁺ → Mn²⁺ + 4 H₂O', oxAt: 'Fe²⁺ → Fe³⁺', oxB: 'Fe²⁺ → Fe³⁺ + 1 e⁻', rdB: 'MnO₄⁻ + 8 H⁺ + 5 e⁻ → Mn²⁺ + 4 H₂O', mo: 5, mr: 1, e: 5, tot: 'MnO₄⁻ + 5 Fe²⁺ + 8 H⁺ → Mn²⁺ + 5 Fe³⁺ + 4 H₂O' },
    cr_fe: { n: 'Cr₂O₇²⁻ + Fe²⁺ (medio ácido)', med: 'ácido', un: 'Cr₂O₇²⁻ + Fe²⁺ → Cr³⁺ + Fe³⁺', ox: 'Fe²⁺', oxs: ['+2', '+3'], oxe: 'Fe', rd: 'Cr₂O₇²⁻', rds: ['+6', '+3'], rde: 'Cr',
      oxSk: 'Fe²⁺ → Fe³⁺', rdSk: 'Cr₂O₇²⁻ → Cr³⁺', rdAt: 'Cr₂O₇²⁻ + 14 H⁺ → 2 Cr³⁺ + 7 H₂O', oxAt: 'Fe²⁺ → Fe³⁺', oxB: 'Fe²⁺ → Fe³⁺ + 1 e⁻', rdB: 'Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ → 2 Cr³⁺ + 7 H₂O', mo: 6, mr: 1, e: 6, tot: 'Cr₂O₇²⁻ + 6 Fe²⁺ + 14 H⁺ → 2 Cr³⁺ + 6 Fe³⁺ + 7 H₂O' },
    cu_no3: { n: 'Cu + NO₃⁻ (medio ácido)', med: 'ácido', un: 'Cu + NO₃⁻ → Cu²⁺ + NO', ox: 'Cu', oxs: ['0', '+2'], oxe: 'Cu', rd: 'NO₃⁻', rds: ['+5', '+2'], rde: 'N',
      oxSk: 'Cu → Cu²⁺', rdSk: 'NO₃⁻ → NO', rdAt: 'NO₃⁻ + 4 H⁺ → NO + 2 H₂O', oxAt: 'Cu → Cu²⁺', oxB: 'Cu → Cu²⁺ + 2 e⁻', rdB: 'NO₃⁻ + 4 H⁺ + 3 e⁻ → NO + 2 H₂O', mo: 3, mr: 2, e: 6, tot: '3 Cu + 2 NO₃⁻ + 8 H⁺ → 3 Cu²⁺ + 2 NO + 4 H₂O' },
    h2o2_fe: { n: 'H₂O₂ + Fe²⁺ (medio ácido)', med: 'ácido', un: 'H₂O₂ + Fe²⁺ → H₂O + Fe³⁺', ox: 'Fe²⁺', oxs: ['+2', '+3'], oxe: 'Fe', rd: 'H₂O₂', rds: ['−1', '−2'], rde: 'O',
      oxSk: 'Fe²⁺ → Fe³⁺', rdSk: 'H₂O₂ → H₂O', rdAt: 'H₂O₂ + 2 H⁺ → 2 H₂O', oxAt: 'Fe²⁺ → Fe³⁺', oxB: 'Fe²⁺ → Fe³⁺ + 1 e⁻', rdB: 'H₂O₂ + 2 H⁺ + 2 e⁻ → 2 H₂O', mo: 2, mr: 1, e: 2, tot: 'H₂O₂ + 2 Fe²⁺ + 2 H⁺ → 2 H₂O + 2 Fe³⁺' },
    mn_i: { n: 'MnO₄⁻ + I⁻ (medio básico)', med: 'básico', un: 'MnO₄⁻ + I⁻ → MnO₂ + I₂', ox: 'I⁻', oxs: ['−1', '0'], oxe: 'I', rd: 'MnO₄⁻', rds: ['+7', '+4'], rde: 'Mn',
      oxSk: '2 I⁻ → I₂', rdSk: 'MnO₄⁻ → MnO₂', rdAt: 'MnO₄⁻ + 2 H₂O → MnO₂ + 4 OH⁻', oxAt: '2 I⁻ → I₂', oxB: '2 I⁻ → I₂ + 2 e⁻', rdB: 'MnO₄⁻ + 2 H₂O + 3 e⁻ → MnO₂ + 4 OH⁻', mo: 3, mr: 2, e: 6, tot: '2 MnO₄⁻ + 6 I⁻ + 4 H₂O → 2 MnO₂ + 3 I₂ + 8 OH⁻' }
  };
  var STEP = ['Números de oxidación', 'Semirreacciones', 'Átomos, O y H', 'Carga con electrones', 'Igualar e⁻ y sumar'];
  var S = { r: 'mn_fe', step: 5 }, g = null, el = [], lab = [], cur = 0;
  function stages() {
    return [
      ['Números de oxidación', 'N.º de oxidación', 'Quien aumenta su número de oxidación se oxida; quien lo disminuye se reduce',
        '<p>Asigna <b>números de oxidación</b> y detecta qué especie <b>pierde electrones (se oxida)</b> y cuál <b>los gana (se reduce)</b>. El agente reductor es el que se oxida; el oxidante, el que se reduce. Cambia de reacción en «Lab» para ver otros casos.</p>'],
      ['Semirreacciones', 'Semirreacciones', 'Separa la oxidación y la reducción',
        '<p>Escribe por separado las <b>dos semirreacciones</b>, con las especies que contienen el elemento que cambia. Todavía <b>no</b> están balanceadas: solo se identifican reactivo y producto de cada una.</p>'],
      ['Balancear átomos, O y H', 'Átomos, O, H', 'Medio ácido: O con H₂O y H con H⁺. Medio básico: usa OH⁻ y H₂O',
        '<p>Balancea primero los átomos distintos de O e H; luego el <b>oxígeno con H₂O</b> y el <b>hidrógeno con H⁺</b>. En medio básico se balancea igual y después se añade un OH⁻ por cada H⁺ a ambos lados (o se balancea directamente con OH⁻ y H₂O).</p>'],
      ['Balancear la carga', 'Carga con e⁻', 'Agrega electrones para igualar las cargas',
        '<p>Agrega <b>electrones</b> al lado que tenga más carga positiva para igualar las cargas totales. Los electrones quedan a la <b>derecha en la oxidación</b> y a la <b>izquierda en la reducción</b>.</p>'],
      ['Igualar electrones y sumar', 'Suma final', 'Los electrones ganados deben ser iguales a los perdidos',
        '<p>Multiplica cada semirreacción para que los <b>electrones cedidos</b> igualen a los <b>ganados</b>, súmalas y simplifica lo que aparece en ambos lados. Comprueba que átomos y carga quedan balanceados.</p>']
    ];
  }
  var def = {
    key: 'balanceo-redox', title: 'Balanceo redox: método ion-electrón', subtitle: 'Simulador 3D · química general', accent: { dark: '#faa2c1', light: '#c2255c' },
    stages: stages, nStages: 5, dur: 10, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 4, 22], target: [0, 2, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 2, 26], target: [0, 2, 0] }],
    layers: [{ id: 'e', label: 'Electrones', icon: 'e⁻' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      function beaker(x, c) { var G = new T.Group(); G.position.set(x, 0, 0); g.add(G); var b = new T.Mesh(new T.CylinderGeometry(3, 3, 6, 28, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); b.position.y = 3; G.add(b); var l = new T.Mesh(new T.CylinderGeometry(2.9, 2.9, 4.5, 28), new T.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.55 })); l.position.y = 2.25; G.add(l); var r = new T.Mesh(new T.BoxGeometry(0.4, 7, 0.4), new T.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.6, roughness: 0.4 })); r.position.set(0, 4, 0); G.add(r); return G; }
      g.userData.A = beaker(-7, 0xffa8a8); g.userData.B = beaker(7, 0x91a7ff);
      var wire = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 14, 8), new T.MeshStandardMaterial({ color: 0xadb5bd })); wire.rotation.z = Math.PI / 2; wire.position.set(0, 8, 0); g.add(wire);
      var e = new T.SphereGeometry(0.28, 12, 8); for (i = 0; i < 12; i++) { var m = new T.Mesh(e, new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x8a6d00 })); g.add(m); el.push(m); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, r = R[S.r], i = f.i; if (!P.manual) S.step = i + 1; cur = S.step; var on = ctx.layer('e'), n = (S.step >= 4 ? r.e : 0), k;
      el.forEach(function (m, j) { m.visible = on && j < n; if (j < n) { var u = ((ctx.now * 0.35 + j / Math.max(1, n)) % 1); m.position.set(-7 + 14 * u, 8 + 0.9 * Math.sin(u * 3.1416) * 0, 0); } });
      lab[0].pos(-7, 8.2, 0).set('Se oxida: ' + r.ox + ' (' + r.oxs[0] + ' → ' + r.oxs[1] + ')', 'bl-neg').vis(S.step >= 1);
      lab[1].pos(7, 8.2, 0).set('Se reduce: ' + r.rd + ' (' + r.rde + ' ' + r.rds[0] + ' → ' + r.rds[1] + ')', 'bl-pos').vis(S.step >= 1);
      lab[2].pos(0, 10.3, 0).set(S.step >= 4 ? 'e⁻ transferidos: ' + r.e : '', 'bl-lead').vis(S.step >= 4);
      lab[3].pos(-7, -0.8, 0).set('Ánodo · agente reductor', 'bl-d').vis(true);
      lab[4].pos(7, -0.8, 0).set('Cátodo · agente oxidante', 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.r) u.r.set(S.r); if (u.step) u.step.set(S.step); },
    hud: function () { var r = R[S.r]; return { eq: { chip: 'e⁻', name: 'Reacción', body: '<div class="eqline"><small>Medio</small>' + r.med + '</div><div class="eqline"><small>Oxidante</small>' + r.rd + '</div><div class="eqline"><small>Reductor</small>' + r.ox + '</div><div class="eqline"><small>e⁻ intercambiados</small>' + r.e + '</div>' }, legend: [{ label: 'Esferas amarillas', color: '#ffd43b', text: 'electrones que pasan del reductor al oxidante' }] }; },
    measures: function () { var r = R[S.r]; return [['Medio', r.med], ['Se oxida', r.ox], ['Se reduce', r.rd], ['Factor oxidación', '×' + r.mo], ['Factor reducción', '×' + r.mr], ['e⁻ transferidos', String(r.e)]]; },
    ideas: ['Oxidación: pérdida de e⁻ (aumenta el n.º de oxidación).', 'Reducción: ganancia de e⁻.', 'Igualar los e⁻ cedidos y ganados.', 'Verifica átomos y carga al final.'],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Reacción redox'); el2.appendChild(c);
      ui.r = kit.ui.options({ label: 'Reacción', cols: 1, value: S.r, options: Object.keys(R).map(function (k) { return { v: k, label: R[k].n }; }), onChange: function (v) { ctx.goManual(); S.r = v; } });
      ui.step = kit.ui.slider({ label: 'Pasos mostrados', min: 1, max: 5, step: 1, value: S.step, format: function (v) { return v + ' · ' + STEP[v - 1]; }, onInput: function (v) { ctx.goManual(); S.step = v; } });
      c.appendChild(ui.r); c.appendChild(kit.ui.sliders([ui.step])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Números de oxidación', h: 190, note: 'Cambio del n.º de oxidación del elemento que se oxida y del que se reduce.', draw: function (cx, w, h, col) {
      var r = R[S.r], num = function (s) { return parseInt(String(s).replace('−', '-').replace('+', ''), 10); }, vals = [num(r.oxs[0]), num(r.oxs[1]), num(r.rds[0]), num(r.rds[1])], L = 40, B = 30, Tp = 12, ph = h - Tp - B, pw = w - L - 10, lo = -3, hi = 8, i, y = function (v) { return Tp + ph * (1 - (v - lo) / (hi - lo)); };
      cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(L, y(0)); cx.lineTo(L + pw, y(0)); cx.stroke(); cx.font = '11px system-ui'; cx.textAlign = 'center';
      [[0, 1, '#ff8787', r.oxe], [2, 3, '#748ffc', r.rde]].forEach(function (p, k) { var x1 = L + pw * (0.15 + k * 0.5), x2 = x1 + pw * 0.25; cx.strokeStyle = p[2]; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x1, y(vals[p[0]])); cx.lineTo(x2, y(vals[p[1]])); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = p[2]; cx.beginPath(); cx.arc(x1, y(vals[p[0]]), 4, 0, 6.28); cx.arc(x2, y(vals[p[1]]), 4, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.fillText(p[3] + ' ' + (vals[p[0]] > 0 ? '+' : '') + vals[p[0]] + ' → ' + (vals[p[1]] > 0 ? '+' : '') + vals[p[1]], (x1 + x2) / 2, h - 10); });
    } }],
    calc: function () {
      var r = R[S.r], s = S.step, row = function (a, b, on) { return '<tr' + (on ? '' : ' style="font-style:italic"') + '><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">' + r.un + ' · medio ' + r.med + '</div><table class="calc-table">' + row('1. N.º de oxidación', r.oxe + ': ' + r.oxs[0] + ' → ' + r.oxs[1] + ' (se oxida) · ' + r.rde + ': ' + r.rds[0] + ' → ' + r.rds[1] + ' (se reduce)', s >= 1) + row('2. Semirreacciones', 'Ox: ' + r.oxSk + '<br>Red: ' + r.rdSk, s >= 2) + row('3. Átomos, O y H', 'Ox: ' + r.oxAt + '<br>Red: ' + r.rdAt, s >= 3) + row('4. Carga con e⁻', 'Ox: ' + r.oxB + '<br>Red: ' + r.rdB, s >= 4) + row('5. Igualar y sumar', '× ' + r.mo + ' (ox) · × ' + r.mr + ' (red)<br><b>' + r.tot + '</b>', s >= 5) + '</table>';
    },
    quiz: [
      { q: 'En MnO₄⁻ el número de oxidación del Mn es…', options: ['+7', '+4', '+2', '−1'], answer: 0, why: 'Mn + 4(−2) = −1 → Mn = +7.' },
      { q: 'En medio ácido, los átomos de O se balancean con…', options: ['H₂O', 'OH⁻', 'H₂', 'e⁻'], answer: 0, why: 'Luego los H con H⁺.' },
      { q: 'En una semirreacción de oxidación los electrones aparecen…', options: ['a la derecha', 'a la izquierda', 'en ambos lados', 'no aparecen'], answer: 0, why: 'Se pierden y son producto.' },
      { q: 'Para MnO₄⁻ → Mn²⁺ en medio ácido, ¿cuántos e⁻ se ganan?', options: ['5', '3', '7', '2'], answer: 0, why: '+7 → +2.' },
      { q: 'En Cu + NO₃⁻ → Cu²⁺ + NO se intercambian en total…', options: ['6 e⁻ (3Cu y 2NO₃⁻)', '2 e⁻', '3 e⁻', '5 e⁻'], answer: 0, why: 'mcm de 2 y 3 es 6.' },
      { q: 'El agente reductor es la especie que…', options: ['se oxida', 'se reduce', 'gana electrones', 'no cambia'], answer: 0, why: 'Reduce a otra cediendo e⁻.' }
    ],
    help: { intro: 'Elige la reacción y revela los cinco pasos del método. Las esferas amarillas son los electrones que van del reductor (izquierda) al oxidante (derecha).', items: [['Vasos', 'izquierdo = semirreacción de oxidación (reductor); derecho = semirreacción de reducción (oxidante).'], ['Electrones', 'las esferas amarillas viajan del reductor al oxidante; su número es el que se iguala al final.'], ['Controles', '«Reacción» elige el sistema (permanganato, dicromato, nitrato, peróxido o medio básico) y «Pasos mostrados» revela el método ion-electrón paso a paso.'], ['Gráfico', '«Números de oxidación» de cada especie, para ver quién se oxida y quién se reduce.']], try: ['Con MnO₄⁻ + Fe²⁺, revela paso a paso: el Mn pasa de +7 a +2 y gana 5 e⁻.', 'Antes de revelar el último paso, predice por cuánto hay que multiplicar cada semirreacción.', 'Elige la reacción en medio básico: se balancea con OH⁻ y H₂O en lugar de H⁺.'] }
  };
  MSim.create(def);
})();
