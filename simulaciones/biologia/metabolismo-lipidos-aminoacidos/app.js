/* Metabolismo de lípidos y aminoácidos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var STEP = [['Deshidrogenación (FAD)', 'acil-CoA deshidrogenasa: forma el doble enlace Cα=Cβ y produce FADH₂'], ['Hidratación', 'enoil-CoA hidratasa: agrega H₂O y forma el 3-hidroxiacil-CoA'], ['Deshidrogenación (NAD⁺)', '3-hidroxiacil-CoA deshidrogenasa: oxida a cetona y produce NADH'], ['Tiólisis', 'tiolasa: la CoA-SH corta y libera acetil-CoA; la cadena queda 2 C más corta']];
  var AA = [['Ala', 'piruvato', 'glucogénico'], ['Asp', 'oxalacetato', 'glucogénico'], ['Glu', 'α-cetoglutarato', 'glucogénico'], ['Leu', 'acetil-CoA', 'cetogénico'], ['Lys', 'acetil-CoA', 'cetogénico'], ['Phe', 'fumarato + acetoacetato', 'mixto'], ['Ile', 'succinil-CoA + acetil-CoA', 'mixto']];
  var S = { n: 16, p: 0, mode: 'chain', aa: 0 }, g = null, lab = [], atoms = [], bonds = [], acet = [], coa = null, tokens = [], shuttle = null, mem = [], amino = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function cyc() { return S.n / 2 - 1; }
  function atp() { return 7 * S.n - 6; }
  function setCyl(m, a, b, r) { var d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, Math.max(0.001, d.length()), r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); }
  function stages() {
    return [
      ['Los lípidos como combustible', 'Visión general', 'Un gramo de grasa rinde ≈ 9 kcal, más del doble que un carbohidrato',
        '<p>Los <b>triacilgliceroles</b> son la reserva energética más concentrada (≈ 37 kJ/g frente a ≈ 17 kJ/g de carbohidratos): están muy reducidos y se almacenan sin agua. Las lipasas liberan <b>ácidos grasos</b> y glicerol; los ácidos grasos se oxidan en la <b>matriz mitocondrial</b> mediante la <b>β-oxidación</b>, y los aminoácidos se degradan tras eliminar el grupo amino.</p>'],
      ['Activación y transporte con carnitina', 'Transporte', 'El acil-CoA no cruza la membrana interna: lo hace como acil-carnitina',
        '<p>En el citosol la <b>acil-CoA sintetasa</b> activa el ácido graso (RCOO⁻ + CoA + ATP → acil-CoA + AMP + PPᵢ; se gastan <b>2 enlaces de alta energía</b>). La membrana mitocondrial interna es impermeable al acil-CoA: la <b>CPT-I</b> lo convierte en <b>acil-carnitina</b>, que entra por una translocasa y la <b>CPT-II</b> lo regenera en la matriz. La CPT-I es el punto de control (inhibida por <b>malonil-CoA</b>).</p>'],
      ['β-oxidación: cuatro reacciones por ciclo', 'β-oxidación', 'Deshidrogenación, hidratación, deshidrogenación y tiólisis',
        '<p>Cada ciclo repite: <b>(1)</b> oxidación con <b>FAD</b> (FADH₂); <b>(2)</b> hidratación; <b>(3)</b> oxidación con <b>NAD⁺</b> (NADH); <b>(4)</b> <b>tiólisis</b>, que libera una unidad de <b>acetil-CoA</b> (2 C) y deja un acil-CoA dos carbonos más corto. Se repite hasta quedar solo acetil-CoA. Elige la longitud de cadena y avanza.</p>'],
      ['Balance de ATP', 'Balance', 'Un ácido graso de n carbonos rinde 7n − 6 ATP',
        '<p>Un ácido graso saturado de <b>n</b> carbonos (n par) requiere <b>n/2 − 1</b> ciclos y produce <b>n/2 acetil-CoA</b> (10 ATP cada uno en el ciclo de Krebs), <b>n/2 − 1 FADH₂</b> (1,5 ATP) y <b>n/2 − 1 NADH</b> (2,5 ATP); se restan 2 ATP de la activación: <b>ATP = 7n − 6</b>. Para el palmitato (C16): <b>106 ATP</b>. Con exceso de acetil-CoA el hígado forma <b>cuerpos cetónicos</b>.</p>'],
      ['Transaminación', 'Transaminación', 'El grupo amino pasa a α-cetoglutarato formando glutamato (coenzima: PLP)',
        '<p>Para degradar un aminoácido primero se retira el grupo amino: una <b>aminotransferasa</b> con <b>fosfato de piridoxal (PLP, vitamina B₆)</b> transfiere el grupo –NH₂ a <b>α-cetoglutarato</b>, que forma <b>glutamato</b>, y el aminoácido pasa a su <b>α-cetoácido</b>. Es una reacción reversible. Los aminoácidos terminan reuniendo su amino en el glutamato.</p>'],
      ['Ciclo de la urea y esqueleto carbonado', 'Urea', 'NH₄⁺ → urea (hígado); el esqueleto entra al ciclo de Krebs o a cuerpos cetónicos',
        '<p>El glutamato libera <b>NH₄⁺</b> (glutamato deshidrogenasa), tóxico, que el hígado convierte en <b>urea</b> en el <b>ciclo de la urea</b> (consume 4 enlaces de alta energía) y se excreta por la orina. Los esqueletos de carbono se clasifican en <b>glucogénicos</b> (dan piruvato u otros intermediarios del Krebs → glucosa) y <b>cetogénicos</b> (dan acetil-CoA o acetoacetato → cuerpos cetónicos). Selecciona el aminoácido para ver su destino.</p>']
    ];
  }
  var def = {
    key: 'metabolismo-lipidos-aminoacidos', title: 'Metabolismo de lípidos y aminoácidos', subtitle: 'Simulador 3D · bioquímica', accent: { dark: '#ff922b', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [2, 4, 24], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 26], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 24, 4], target: [0, 0, 0] }],
    layers: [{ id: 'cof', label: 'Coenzimas (FADH₂, NADH)', icon: '⚡' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 24; i++) { var a = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshStandardMaterial({ color: i === 0 ? 0xff4d4d : 0x56606b })); g.add(a); atoms.push(a); var b = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: 0xced4da })); g.add(b); bonds.push(b); }
      coa = new T.Mesh(new T.SphereGeometry(0.7, 14, 10), new T.MeshStandardMaterial({ color: 0xe6c229 })); g.add(coa);
      for (i = 0; i < 12; i++) { var t = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), new T.MeshStandardMaterial({ color: i % 2 ? 0x4dabf7 : 0xfab005, emissive: i % 2 ? 0x1c7ed6 : 0xe67700, emissiveIntensity: 0.3 })); g.add(t); tokens.push(t); }
      for (i = 0; i < 3; i++) { var m = new T.Mesh(new T.BoxGeometry(i ? 26 : 26, 0.4, 7), new T.MeshStandardMaterial({ color: 0x9775fa, transparent: true, opacity: 0.4 })); m.position.set(0, -2 + i * 4, 0); m.visible = false; g.add(m); mem.push(m); }
      shuttle = new T.Mesh(new T.OctahedronGeometry(0.7), new T.MeshStandardMaterial({ color: 0xff922b })); g.add(shuttle);
      for (i = 0; i < 5; i++) { var bl = new T.Mesh(new T.BoxGeometry(2.6, 2.6, 1.4), new T.MeshStandardMaterial({ color: [0x4dabf7, 0xffd43b, 0xfab005, 0x69db7c, 0xf06595][i], roughness: 0.5 })); bl.visible = false; g.add(bl); amino.push(bl); }
      for (i = 0; i < 10; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 1 ? 'trans' : (i >= 4 ? 'aa' : 'chain'); S.p = i === 0 ? 0.0 : Math.min(1, f.local * 1.05); if (i === 3) S.n = 4 + 2 * Math.round(f.local * 10); else if (i === 2 || i === 0) S.n = 16; if (i === 5) S.aa = Math.min(6, Math.floor(f.local * 7)); }
      lab.forEach(function (l) { l.vis(false); }); atoms.forEach(function (a) { a.visible = false; }); bonds.forEach(function (b) { b.visible = false; }); tokens.forEach(function (t) { t.visible = false; }); coa.visible = false; shuttle.visible = false; mem.forEach(function (m) { m.visible = false; }); amino.forEach(function (b) { b.visible = false; });
      var q = S.p, cOn = ctx.layer('cof');
      if (S.mode === 'chain') {
        var n = S.n, cy = cyc(), tot = q * cy, c = Math.min(cy - 1e-6, Math.floor(tot)), fr = tot - c, st = Math.min(3, Math.floor(fr * 4)); if (cy < 1) { c = 0; }
        if (q >= 1) { c = cy - 1; fr = 1; st = 3; }
        var pos = [], k; for (k = 0; k < n; k++) pos.push(V(-12 + k * 1.05, (k % 2 ? 0.55 : -0.55) + (k - 2 * (c + (fr > 0.99 ? 1 : 0))) * 0, 0));
        var done = Math.min(c + (st === 3 && fr > 0.9 ? 1 : 0) + (q >= 1 ? 0 : 0), cy);
        for (k = 0; k < n; k++) { var cut = k < 2 * done, a = atoms[k]; a.visible = true; a.position.copy(pos[k]); if (cut) { a.position.y += 3.5 + 0.8 * Math.floor(k / 2); a.position.x = -9 + (Math.floor(k / 2)) * 1.6 + (k % 2) * 0.8; a.material.color.setHex(0xffa94d); } else a.material.color.setHex(k === 2 * done ? 0xff4d4d : 0x56606b); if (k > 0) { var b = bonds[k]; var p0 = atoms[k - 1].position, p1 = a.position; var sameGroup = (k < 2 * done) === (k - 1 < 2 * done); b.visible = sameGroup || (k - 1 < 2 * done && k >= 2 * done && false); if (b.visible) setCyl(b, p0, p1, 0.07); } }
        coa.visible = true; coa.position.set(-13.2 + 2 * done * 0 + 0, 0, 0); coa.position.copy(pos[2 * done] ? pos[2 * done].clone().add(V(-1.4, 0, 0)) : V(0, 0, 0)); coa.scale.setScalar(0.8);
        var nT = Math.min(12, Math.floor(tot * 2 + (st >= 2 ? 0 : 0))); for (k = 0; k < Math.min(12, Math.floor(tot) * 2 + (st >= 0 && fr > 0.25 ? 1 : 0) + (st >= 2 ? 1 : 0)); k++) { var tk = tokens[k]; tk.visible = cOn; tk.position.set(-12 + (k % 6) * 1.0 + 6, -4 - Math.floor(k / 6) * 0.9, 0); }
        lab[0].pos(0, 6.2, 0).set('Ácido graso C' + n + ' · ciclo ' + Math.min(cy, c + 1) + ' de ' + cy, 'bl-lead').vis(true);
        lab[1].pos(0, -7, 0).set(q >= 1 ? 'Productos: ' + (n / 2) + ' acetil-CoA · ' + cy + ' FADH₂ · ' + cy + ' NADH' : 'Reacción ' + (st + 1) + ': ' + STEP[st][0], 'bl-d').vis(true);
        lab[2].pos(2, -5.8, 0).set(q >= 1 ? '' : STEP[st][1], 'bl-d').vis(q < 1);
        lab[3].pos(-9, 5.4, 0).set('acetil-CoA liberados: ' + done, 'bl-pos').vis(true); lab[4].pos(7, -4, 0).set('⚡ FADH₂ (naranja) · NADH (azul)', 'bl-d').vis(cOn);
      } else if (S.mode === 'trans') {
        mem.forEach(function (m, j) { m.visible = j !== 1; m.position.y = -4 + j * 6; }); mem[0].position.y = -5; mem[2].position.y = 4;
        var u = sm(q), x = -8 + 16 * u, yy = 7 - 14 * u; shuttle.visible = true; shuttle.position.set(x * 0.2, yy * 0.9, 0); shuttle.rotation.y = now;
        var stg = u < 0.33 ? 'citosol: acil-CoA → CPT-I → acil-carnitina' : (u < 0.66 ? 'translocasa: atraviesa la membrana interna' : 'matriz: CPT-II regenera acil-CoA');
        lab[0].pos(0, 9.5, 0).set('Espacio intermembrana → matriz mitocondrial', 'bl-lead').vis(true); lab[1].pos(0, -9.5, 0).set(stg, 'bl-d').vis(true); lab[2].pos(11, 7, 0).set('citosol', 'bl-d').vis(true); lab[3].pos(11, 0, 0).set('espacio intermembrana', 'bl-d').vis(true); lab[4].pos(11, -7, 0).set('matriz', 'bl-d').vis(true);
        mem[0].visible = true; mem[2].visible = true; mem[0].position.y = 4; mem[2].position.y = -4;
      } else {
        var aa = AA[S.aa], t = sm(Math.min(1, q * 1.2)); amino.forEach(function (b, j) { b.visible = true; b.rotation.y = now * 0.2; });
        amino[0].position.set(-8, 2, 0); amino[1].position.set(-8, -2.5, 0); amino[2].position.set(8, 2, 0); amino[3].position.set(8, -2.5, 0); amino[4].position.set(0, 0, 0); amino[0].material.color.setHex(0x4dabf7); amino[1].material.color.setHex(0xffd43b); amino[2].material.color.setHex(0xfab005); amino[3].material.color.setHex(0x69db7c);
        var nh = new T.Vector3(-8 + 16 * t, 2 - 0 * t, 0); amino[4].position.set(nh.x, nh.y + 1.2 * Math.sin(Math.PI * t), 0); amino[4].scale.setScalar(0.5);
        lab[0].pos(-8, 5, 0).set(aa[0] + ' (aminoácido)', 'bl-lead').vis(true); lab[1].pos(8, 5, 0).set('α-cetoglutarato → glutamato', 'bl-lead').vis(true); lab[2].pos(-8, -5.5, 0).set('α-cetoácido: ' + aa[1], 'bl-d').vis(true); lab[3].pos(0, 3.4, 0).set('–NH₂ (vía PLP)', 'bl-warn').vis(true); lab[4].pos(0, -7.5, 0).set(aa[0] + ' es ' + aa[2] + ': esqueleto → ' + aa[1], 'bl-pos').vis(true);
        amino[1].visible = true; amino[2].visible = true; amino[3].visible = true;
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.n) u.n.set(S.n); if (u.p && !ctx.P.manual) u.p.set(S.p); if (u.aa) u.aa.set(S.aa); },
    hud: function () { return { eq: { chip: 'C' + S.n, name: 'Ácido graso C' + S.n, body: '<div class="eqline"><small>Ciclos</small>' + cyc() + '</div><div class="eqline"><small>Acetil-CoA</small>' + S.n / 2 + '</div><div class="eqline"><small>FADH₂ / NADH</small>' + cyc() + ' / ' + cyc() + '</div><div class="eqline"><small>ATP neto</small>' + atp() + '</div>' }, legend: [{ label: 'Naranja', color: '#fab005', text: 'FADH₂ (1,5 ATP)' }, { label: 'Azul', color: '#4dabf7', text: 'NADH (2,5 ATP)' }] }; },
    measures: function () { return [['Ácido graso', 'C' + S.n + ' saturado'], ['Ciclos de β-oxidación', String(cyc())], ['Acetil-CoA', String(S.n / 2)], ['FADH₂ / NADH', cyc() + ' / ' + cyc()], ['ATP neto', String(atp())], ['ATP por carbono', fmt(atp() / S.n, 2)]]; },
    ideas: ['n/2 − 1 ciclos para un ácido graso de n C.', 'ATP neto = 7n − 6 (palmitato: 106).', 'La CPT-I regula la entrada a la mitocondria.', 'Aminoácidos: transaminación → urea y esqueleto C.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Ácido graso'); el.appendChild(c);
      ui.n = kit.ui.slider({ label: 'N.º de carbonos', min: 4, max: 24, step: 2, value: S.n, format: function (v) { return 'C' + v; }, onInput: function (v) { ctx.goManual(); S.mode = 'chain'; S.n = v; } });
      ui.p = kit.ui.slider({ label: 'Avance', min: 0, max: 1, step: 0.005, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.n, ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'β-oxidación', fn: function () { ctx.goManual(); S.mode = 'chain'; } }, { t: 'Transporte', fn: function () { ctx.goManual(); S.mode = 'trans'; } }, { t: 'Aminoácidos', fn: function () { ctx.goManual(); S.mode = 'aa'; } }]));
      var d = kit.ui.card('Aminoácido'); el.appendChild(d); ui.aa = kit.ui.options({ label: 'Aminoácido', cols: 4, value: S.aa, options: AA.map(function (a, i) { return { v: i, label: a[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'aa'; S.aa = +v; } }); d.appendChild(ui.aa); d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'ATP neto frente a la longitud de la cadena', h: 240, note: 'ATP = 7n − 6. Punto: tu ácido graso. Referencia: glucosa ≈ 30–32 ATP.', draw: function (cx, w, h, col) {
      var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, mx = 170; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 4; i <= 24; i += 4) cx.fillText('C' + i, L + pw * (i - 4) / 20, h - B + 14); cx.textAlign = 'right'; for (i = 0; i <= 150; i += 50) cx.fillText(i, L - 4, Tp + ph * (1 - i / mx) + 3);
      cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 4; i <= 24; i += 2) { (i > 4 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (i - 4) / 20, Tp + ph * (1 - (7 * i - 6) / mx)); } cx.stroke(); cx.lineWidth = 1;
      cx.strokeStyle = '#69db7c'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - 31 / mx)); cx.lineTo(L + pw, Tp + ph * (1 - 31 / mx)); cx.stroke(); cx.setLineDash([]); cx.fillStyle = '#69db7c'; cx.textAlign = 'left'; cx.fillText('glucosa', L + 4, Tp + ph * (1 - 31 / mx) - 3);
      cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.n - 4) / 20, Tp + ph * (1 - atp() / mx), 5, 0, 6.28); cx.fill();
    } }],
    calc: function () { var n = S.n, cy = cyc(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">Balance de C' + n + '</div><table class="calc-table">' + row('Ciclos', 'n/2 − 1 = ' + cy) + row('Acetil-CoA', n / 2 + ' × 10 = ' + 5 * n + ' ATP') + row('FADH₂', cy + ' × 1,5 = ' + fmt(1.5 * cy, 1) + ' ATP') + row('NADH', cy + ' × 2,5 = ' + fmt(2.5 * cy, 1) + ' ATP') + row('Activación', '−2 ATP') + row('Total', '<b>' + atp() + ' ATP</b> (7n − 6)') + '</table>'; },
    quiz: [
      { q: 'El palmitato (C16) experimenta… ciclos de β-oxidación.', options: ['7', '8', '16', '6'], answer: 0, why: 'n/2 − 1 = 7.' },
      { q: 'El ATP neto del palmitato es…', options: ['106', '129', '32', '12'], answer: 0, why: '7·16 − 6.' },
      { q: 'La carnitina transporta…', options: ['grupos acilo a la matriz', 'glucosa', 'O₂', 'NADH'], answer: 0, why: 'Lanzadera de acil-carnitina.' },
      { q: 'La transaminación necesita como coenzima…', options: ['PLP (vitamina B6)', 'FAD', 'biotina', 'TPP'], answer: 0, why: 'Fosfato de piridoxal.' },
      { q: 'El NH₄⁺ se elimina principalmente como…', options: ['urea', 'amoníaco gaseoso', 'glucosa', 'ácido úrico'], answer: 0, why: 'Ciclo de la urea en el hígado.' },
      { q: 'Un aminoácido cetogénico origina…', options: ['acetil-CoA', 'oxalacetato', 'glucosa neta', 'urea'], answer: 0, why: 'Leucina y lisina.' }
    ],
    help: { intro: 'Elige la longitud de cadena y avanza para ver cada ciclo de β-oxidación; con los botones cambias a transporte o a aminoácidos.', items: [['Cadena', 'el ácido graso se acorta 2 C en cada ciclo de β-oxidación; cada esfera naranja es un acetil-CoA liberado.'], ['Coenzimas', 'cubos naranjas = FADH₂ (1,5 ATP) y azules = NADH (2,5 ATP); se muestran u ocultan con su capa.'], ['Controles', '«N.º de carbonos» fija la longitud de la cadena y «Avance» recorre los ciclos; los botones cambian a «Transporte» (carnitina) o a «Aminoácidos», donde eliges el aminoácido.'], ['Gráfico', '«ATP neto frente a la longitud de la cadena» (7n − 6 para un ácido saturado de n C).']], try: ['Con 16 C cuenta los ciclos: deben ser n/2 − 1 = 7, con 8 acetil-CoA.', 'Cambia la longitud y verifica en el gráfico que el ATP neto sigue 7n − 6 (palmitato: 106).', 'En «Aminoácidos» sigue el grupo amino: pasa por transaminación (PLP) y termina en urea.'] }
  };
  MSim.create(def);
})();
