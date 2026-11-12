/* Tectónica de placas y sismos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, VP = 6, VS = 3.5;
  var B = { conv: { n: 'Convergente (subducción)', ej: 'placa de Nazca bajo la Sudamericana (Chile)' }, div: { n: 'Divergente (dorsal)', ej: 'dorsal mesoatlántica, Islandia' }, trans: { n: 'Transformante (falla)', ej: 'falla de San Andrés (EE. UU.)' } };
  var S = { b: 'conv', mv: 0, quake: false, tq: 0, depth: 30, dist: 120, M: 7, cut: true };
  var G = {}, lab = {}, K = 0.035;   // unidades por km en la vista del sismo
  function dSP(dt) { return dt * VP * VS / (VP - VS); }
  function stages() {
    return [
      ['Placas tectónicas', 'Placas', 'La litósfera está dividida en placas que se mueven sobre el manto',
        '<p>La capa externa rígida de la Tierra, la <b>litósfera</b> (corteza y parte superior del manto), está dividida en <b>placas tectónicas</b> que se mueven unos pocos <b>centímetros por año</b>, impulsadas por las <b>corrientes de convección</b> del manto y por el peso de las placas que se hunden. En sus <b>bordes</b> se concentran los sismos y los volcanes.</p>'],
      ['Borde convergente: subducción', 'Convergente', 'Una placa oceánica se hunde bajo una continental: fosa, cordillera y volcanes',
        '<p>Frente a Chile, la <b>placa de Nazca</b> (oceánica, más densa) se mete bajo la <b>placa Sudamericana</b> a unos <b>6–7 cm por año</b>: es una zona de <b>subducción</b>. Se forman una <b>fosa oceánica</b>, la <b>cordillera de los Andes</b> y volcanes, porque la placa que se hunde libera agua que funde parcialmente el manto. Los roces entre placas generan los grandes sismos chilenos.</p>'],
      ['Borde divergente', 'Divergente', 'Dos placas se separan y el magma forma nueva corteza oceánica',
        '<p>En un <b>borde divergente</b> las placas se separan. El manto sube, se funde parcialmente y el <b>magma</b> crea nueva corteza en las <b>dorsales oceánicas</b>, como la dorsal mesoatlántica. Las rocas son más jóvenes cerca de la dorsal y más antiguas lejos de ella. Hay sismos poco profundos y volcanismo basáltico (Islandia).</p>'],
      ['Borde transformante', 'Transformante', 'Las placas se deslizan lateralmente una junto a otra',
        '<p>En un <b>borde transformante</b> las placas se deslizan <b>lateralmente</b>, sin crear ni destruir corteza, como en la <b>falla de San Andrés</b>. El roce las traba, acumulan tensión durante años y la liberan de golpe en un <b>sismo</b>. No suele haber volcanes.</p>'],
      ['Sismo y ondas sísmicas', 'Sismo', 'Del hipocentro salen ondas P (más rápidas) y S (más lentas)',
        '<p>Un <b>sismo</b> es la liberación repentina de energía acumulada en una falla. El punto de ruptura es el <b>hipocentro</b> y su proyección en la superficie, el <b>epicentro</b>. Salen <b>ondas P</b> (primarias, longitudinales, ≈ 6 km/s, atraviesan sólidos y líquidos) y <b>ondas S</b> (secundarias, transversales, ≈ 3,5 km/s, solo en sólidos). En la superficie, las ondas superficiales causan la mayor parte del daño.</p>'],
      ['Localizar y medir un sismo', 'Medir', 'El retraso S − P da la distancia; la magnitud mide la energía liberada',
        '<p>Un <b>sismógrafo</b> registra primero las ondas P y luego las S. Cuanto más lejos está el epicentro, mayor es el retraso: <b>d ≈ 8,4 km por segundo de diferencia S − P</b>. Con tres estaciones se ubica el epicentro (triangulación). La <b>magnitud</b> mide la energía: cada grado más libera ≈ <b>32 veces</b> más energía. Chile registró el mayor sismo medido: Valdivia 1960, magnitud 9,5. Prevención: construcción sismorresistente, planes de evacuación y alerta de <b>tsunami</b>.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.quake = false;
    if (i === 0) { S.b = 'conv'; S.mv = l; }
    else if (i === 1) { S.b = 'conv'; S.mv = l; }
    else if (i === 2) { S.b = 'div'; S.mv = l; }
    else if (i === 3) { S.b = 'trans'; S.mv = l; }
    else { S.b = 'conv'; S.quake = true; S.tq = l * (i === 4 ? 45 : 60); S.dist = i === 5 ? 60 + 180 * Math.floor(l * 3) / 2 : 120; }
  }
  function box(w, h, d, c, o) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}))); }
  var def = {
    key: 'tectonica-sismos', title: 'Tectónica de placas y sismos', subtitle: 'Simulador 3D · ciencias de la Tierra', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-2, 6, 15], target: [-1.5, -0.5, 0] }, { id: 'corte', label: 'Corte', pos: [-1.5, 0.5, 16], target: [-1.5, -1, 0] }, { id: 'sup', label: 'Superior', pos: [-1.5, 17, 2], target: [-1.5, 0, 0] }],
    layers: [{ id: 'arr', label: 'Movimiento de las placas', icon: '➜' }, { id: 'conv', label: 'Convección del manto', icon: '↻' }],
    build: function (ctx) {
      var s = ctx.scene; G.root = new T.Group(); s.add(G.root);
      G.mantle = box(14, 3, 5, 0xe8590c, { emissive: 0x3d1200 }); G.mantle.position.set(0, -3.4, 0); G.root.add(G.mantle);
      G.oc = box(7, 0.7, 5, 0x364fc7); G.co = box(7, 1.3, 5, 0x8d6e4f); G.root.add(G.oc); G.root.add(G.co);
      G.slab = box(5, 0.7, 5, 0x364fc7); G.root.add(G.slab);
      G.sea = box(7, 0.5, 5, 0x4dabf7, { transparent: true, opacity: 0.35 }); G.root.add(G.sea);
      G.andes = new T.Mesh(new T.ConeGeometry(1.2, 1.8, 4), new T.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 })); G.root.add(G.andes);
      G.volc = new T.Mesh(new T.ConeGeometry(0.6, 1.2, 16), new T.MeshStandardMaterial({ color: 0x5c3b2e })); G.root.add(G.volc);
      G.mag = box(0.5, 3, 5, 0xff6b2b, { emissive: 0x7a1c00 }); G.root.add(G.mag);
      G.cells = []; for (var k = 0; k < 2; k++) { var c = new T.Mesh(new T.TorusGeometry(1.3, 0.06, 8, 40), new T.MeshBasicMaterial({ color: 0xffd8a8 })); c.position.set(k ? 3.2 : -3.2, -3.4, 2.6); G.root.add(c); G.cells.push(c); }
      G.aL = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1.6, 0xffffff, 0.4, 0.3); G.aR = new T.ArrowHelper(new T.Vector3(-1, 0, 0), new T.Vector3(), 1.6, 0xffffff, 0.4, 0.3); G.root.add(G.aL); G.root.add(G.aR);
      // sismo
      G.hypo = new T.Mesh(new T.SphereGeometry(0.18, 14, 10), new T.MeshBasicMaterial({ color: 0xffd43b })); G.root.add(G.hypo);
      G.wP = new T.Mesh(new T.SphereGeometry(1, 32, 16), new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false })); G.root.add(G.wP);
      G.wS = new T.Mesh(new T.SphereGeometry(1, 32, 16), new T.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false })); G.root.add(G.wS);
      G.st = new T.Mesh(new T.CylinderGeometry(0.15, 0.25, 0.5, 8), new T.MeshStandardMaterial({ color: 0x51cf66 })); G.root.add(G.st);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      else { S.mv = (S.mv + dt * 0.08) % 1; if (S.quake) { S.tq += dt * 6; if (S.tq > 70) S.tq = 0; } }
      var arr = ctx.layer('arr'), cv = ctx.layer('conv'), ph = S.mv * 0.8;
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      G.cells.forEach(function (c, k) { c.visible = cv; c.rotation.z = (k ? -1 : 1) * ctx.now * 0.6; });
      G.slab.visible = G.andes.visible = G.volc.visible = false; G.mag.visible = false; G.sea.visible = true;
      if (S.b === 'conv') {
        G.oc.position.set(-3.5 + ph, 0, 0); G.co.position.set(3.5, 0.3, 0); G.oc.scale.x = 1; G.co.scale.z = 1;
        G.slab.visible = true; G.slab.position.set(0.9 + ph * 0.5, -1.6 - ph * 0.3, 0); G.slab.rotation.z = -0.55;
        G.sea.position.set(-3.5, 0.55, 0); G.andes.visible = true; G.andes.position.set(3.2, 1.85, 0); G.volc.visible = true; G.volc.position.set(4.6, 1.5, 0);
        G.aL.position.set(-4, 1.3, 2.2); G.aL.setDirection(new T.Vector3(1, 0, 0)); G.aR.position.set(5, 1.6, 2.2); G.aR.setDirection(new T.Vector3(-1, 0, 0));
        lab.a.pos(-3.5, 1.6, 0).set('Placa oceánica (Nazca)', 'bl-lead').vis(true); lab.b.pos(3.5, 3.2, 0).set('Placa continental (Sudamericana)', 'bl-pos').vis(true); lab.c.pos(0.2, 0.9, 0).set('Fosa', 'bl-d').vis(!S.quake);
      } else if (S.b === 'div') {
        G.oc.position.set(-3.6 - ph, 0, 0); G.co.position.set(3.6 + ph, 0, 0); G.co.material.color.setHex(0x364fc7); G.co.scale.set(1, 0.55, 1);
        G.mag.visible = true; G.mag.position.set(0, -1.4, 0); G.mag.scale.x = 0.5 + ph * 2.5; G.sea.position.set(0, 0.55, 0); G.sea.scale.x = 2;
        G.aL.position.set(-1.5, 1.2, 2.2); G.aL.setDirection(new T.Vector3(-1, 0, 0)); G.aR.position.set(1.5, 1.2, 2.2); G.aR.setDirection(new T.Vector3(1, 0, 0));
        lab.a.pos(0, 1.8, 0).set('Dorsal: sube magma y se crea corteza nueva', 'bl-warn').vis(true);
      } else {
        G.oc.position.set(-3.5, 0, -ph * 2); G.co.position.set(3.5, 0, ph * 2); G.co.material.color.setHex(0x8d6e4f); G.co.scale.set(1, 0.55, 1); G.sea.visible = false;
        G.aL.position.set(-3.5, 1.2, 0); G.aL.setDirection(new T.Vector3(0, 0, -1)); G.aR.position.set(3.5, 1.2, 0); G.aR.setDirection(new T.Vector3(0, 0, 1));
        lab.a.pos(0, 1.6, 0).set('Falla: las placas se deslizan lateralmente', 'bl-warn').vis(true);
      }
      if (S.b === 'conv') { G.co.material.color.setHex(0x8d6e4f); G.co.scale.set(1, 1, 1); G.sea.scale.x = 1; }
      G.aL.visible = G.aR.visible = arr;
      // sismo
      var q = S.quake; G.hypo.visible = G.wP.visible = G.wS.visible = G.st.visible = q;
      [G.oc, G.co, G.slab, G.mantle, G.andes, G.volc].forEach(function (m) { m.material.transparent = true; m.material.opacity = q ? 0.4 : 1; m.material.depthWrite = !q; });
      if (q) {
        var hx = 0.9, hy = 0.5 - S.depth * K, rP = VP * S.tq * K, rS = VS * S.tq * K, sx = hx + S.dist * K;
        G.hypo.position.set(hx, hy, 0); G.wP.position.copy(G.hypo.position); G.wS.position.copy(G.hypo.position); G.wP.scale.setScalar(Math.max(0.01, rP)); G.wS.scale.setScalar(Math.max(0.01, rS));
        G.st.position.set(sx, 1.25, 0);
        var D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS;
        lab.b.pos(hx, hy - 0.6, 1.5).set('Hipocentro · ' + fmt(S.depth, 0) + ' km', 'bl-warn').vis(true);
        lab.c.pos(hx, 2.4, 0).set('Epicentro', 'bl-lead').vis(true);
        lab.d.pos(sx, 2.3, 0).set('Estación a ' + fmt(S.dist, 0) + ' km · t = ' + f1(S.tq) + ' s · ' + (S.tq < tP ? 'aún nada' : S.tq < tS ? 'llegó la onda P' : 'llegaron P y S (S − P = ' + f1(tS - tP) + ' s)'), 'bl-pos').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.b && u.b.set(S.b); u.dist && u.dist.set(S.dist); } },
    hud: function () { return { eq: { chip: '⟷', name: B[S.b].n, body: '<div class="eqline"><small>Ejemplo</small>' + B[S.b].ej + '</div><div class="eqline"><small>Distancia al epicentro</small>d ≈ 8,4 km · (t<sub>S</sub> − t<sub>P</sub>)</div><div class="eqline"><small>Magnitud</small>+1 grado ≈ ×32 en energía</div>' }, legend: [{ label: 'Azul', color: '#364fc7', text: 'corteza oceánica' }, { label: 'Café', color: '#8d6e4f', text: 'corteza continental' }, { label: 'Naranja', color: '#e8590c', text: 'manto' }, { label: 'Esferas', color: '#4dabf7', text: 'onda P (azul) y onda S (roja)' }] }; },
    measures: function () { var D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS; return [['Tipo de borde', B[S.b].n], ['Profundidad del hipocentro', fmt(S.depth, 0) + ' km'], ['Distancia epicentral', fmt(S.dist, 0) + ' km'], ['Llegada onda P', f1(tP) + ' s'], ['Llegada onda S', f1(tS) + ' s'], ['Diferencia S − P', f1(tS - tP) + ' s'], ['Magnitud', f1(S.M) + ' (energía ×' + fmt(Math.pow(31.6, S.M - 5), 0) + ' respecto de M 5)']]; },
    ideas: ['Litósfera dividida en placas que se mueven cm/año.', 'Convergente: subducción, fosa, cordillera y volcanes (Chile).', 'Divergente: dorsal y corteza nueva; transformante: falla lateral.', 'Ondas P (≈ 6 km/s) llegan antes que las S (≈ 3,5 km/s).', 'Distancia ≈ 8,4 km × (t<sub>S</sub> − t<sub>P</sub>).', '+1 de magnitud ≈ 32 veces más energía.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Placas'); el.appendChild(c);
      ui.b = kit.ui.options({ label: 'Tipo de borde', cols: 3, value: S.b, options: Object.keys(B).map(function (k) { return { v: k, label: B[k].n.split(' (')[0] }; }), onChange: function (v) { ctx.goManual(); S.b = v; S.quake = false; } }); c.appendChild(ui.b);
      var c2 = kit.ui.card('Sismo'); el.appendChild(c2);
      ui.depth = kit.ui.slider({ label: 'Profundidad del hipocentro (km)', min: 5, max: 70, step: 5, value: S.depth, digits: 0, onInput: function (v) { ctx.goManual(); S.depth = v; } });
      ui.dist = kit.ui.slider({ label: 'Distancia a la estación (km)', min: 20, max: 300, step: 10, value: S.dist, digits: 0, onInput: function (v) { ctx.goManual(); S.dist = v; } });
      ui.M = kit.ui.slider({ label: 'Magnitud', min: 3, max: 9.5, step: 0.1, value: S.M, digits: 1, onInput: function (v) { ctx.goManual(); S.M = v; } });
      c2.appendChild(kit.ui.sliders([ui.depth, ui.dist, ui.M]));
      c2.appendChild(ctx.btnRow([{ t: 'Generar sismo', primary: true, fn: function () { ctx.goManual(); S.b = 'conv'; S.quake = true; S.tq = 0; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Sismograma de la estación', h: 210, note: 'Primero llega la onda P (pequeña) y luego la S (mayor). El retraso S − P crece con la distancia.', draw: function (cx, w, h, col) {
        var L = 30, R = 10, Tp = 10, Bm = 26, pw = w - L - R, ph = h - Tp - Bm, D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS, tm = Math.max(70, tS + 15), sx = function (t) { return L + pw * t / tm; }, i;
        cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(L, Tp + ph / 2); cx.lineTo(L + pw, Tp + ph / 2); cx.stroke();
        cx.strokeStyle = col.ink; cx.lineWidth = 1.2; cx.beginPath(); var A = 0.25 + 0.07 * (S.M - 3);
        for (i = 0; i <= 600; i++) { var t = tm * i / 600, y = 0.03 * Math.sin(i * 1.7); if (t > tP) y += A * 0.35 * Math.exp(-(t - tP) / 6) * Math.sin((t - tP) * 9); if (t > tS) y += A * Math.exp(-(t - tS) / 9) * Math.sin((t - tS) * 5.5); if (S.quake && t > S.tq) y = 0; var Y = Tp + ph / 2 - y * ph / 1.1; if (i) cx.lineTo(sx(t), Y); else cx.moveTo(sx(t), Y); } cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#4dabf7'; cx.fillRect(sx(tP) - 1, Tp, 2, ph); cx.fillStyle = '#ff6b6b'; cx.fillRect(sx(tS) - 1, Tp, 2, ph);
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= tm; i += 10) cx.fillText(i, sx(i), h - Bm + 13); cx.fillText('t (s) · P: ' + fmt(tP, 1) + ' s · S: ' + fmt(tS, 1) + ' s', L + pw / 2, h - 3);
      } },
      { title: 'Energía según la magnitud', h: 190, note: 'Escala logarítmica: cada grado de magnitud libera ≈ 32 veces más energía.', draw: function (cx, w, h, col) {
        var L = 40, R = 10, Tp = 10, Bm = 26, pw = w - L - R, ph = h - Tp - Bm, sx = function (m) { return L + pw * (m - 3) / 7; }, sy = function (m) { return Tp + ph - ph * (m - 3) / 7; }, i;
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 3; i <= 10; i++) cx.fillText(i, sx(i), h - Bm + 13); cx.fillText('magnitud  ·  log₁₀ de la energía relativa', L + pw / 2, h - 3);
        [['Valdivia 1960', 9.5], ['Maule 2010', 8.8], ['Illapel 2015', 8.3]].forEach(function (q) { cx.fillStyle = 'rgba(255,146,43,.3)'; cx.fillRect(sx(q[1]) - 2, Tp, 4, ph); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(q[0], sx(q[1]) - 4, sy(q[1] - 0.7)); });
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(sx(3), sy(3)); cx.lineTo(sx(10), sy(10)); cx.stroke(); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.M), sy(S.M), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, D = Math.sqrt(S.dist * S.dist + S.depth * S.depth), tP = D / VP, tS = D / VS;
      return '<div class="card-kicker">Sismo · M ' + f1(S.M) + '</div><table class="calc-table">' + row('Distancia al hipocentro', '√(' + fmt(S.dist, 0) + '² + ' + fmt(S.depth, 0) + '²) = <b>' + f1(D) + ' km</b>') + row('t<sub>P</sub> = d/v<sub>P</sub>', f1(D) + '/6 = <b>' + f1(tP) + ' s</b>') + row('t<sub>S</sub> = d/v<sub>S</sub>', f1(D) + '/3,5 = <b>' + f1(tS) + ' s</b>') + row('Distancia por S − P', fmt(8.4, 1) + ' · ' + f1(tS - tP) + ' = <b>' + f1(dSP(tS - tP)) + ' km</b>') + row('Energía respecto de M 5', '31,6^(' + f1(S.M) + ' − 5) ≈ <b>' + fmt(Math.pow(31.6, S.M - 5), 0) + ' veces</b>') + '</table>';
    },
    quiz: [
      { q: 'Las placas tectónicas se mueven aproximadamente…', options: ['algunos centímetros por año', 'algunos metros por día', 'kilómetros por año', 'no se mueven'], answer: 0, why: 'Más o menos lo que crecen las uñas.' },
      { q: 'Frente a Chile, la placa de Nazca…', options: ['se hunde bajo la Sudamericana', 'se separa de la Sudamericana', 'se desliza lateralmente', 'está quieta'], answer: 0, why: 'Es una zona de subducción.' },
      { q: 'En una dorsal oceánica…', options: ['se forma corteza oceánica nueva', 'se destruye corteza', 'chocan dos continentes', 'no hay actividad'], answer: 0, why: 'Borde divergente: sube magma.' },
      { q: 'La falla de San Andrés es un borde…', options: ['transformante', 'convergente', 'divergente', 'de subducción'], answer: 0, why: 'Las placas se deslizan lateralmente.' },
      { q: 'El epicentro de un sismo es…', options: ['el punto de la superficie sobre el hipocentro', 'el lugar donde se rompe la roca en profundidad', 'la estación sismológica', 'el lugar de mayor daño siempre'], answer: 0, why: 'El hipocentro está en profundidad.' },
      { q: 'En un sismógrafo, primero se registra la onda…', options: ['P', 'S', 'superficial', 'todas a la vez'], answer: 0, why: 'La onda P es la más rápida.' },
      { q: 'La diferencia S − P es de 10 s. La distancia al sismo es de unos…', options: ['84 km', '10 km', '35 km', '600 km'], answer: 0, why: 'd ≈ 8,4 km por segundo de diferencia.' },
      { q: 'Un sismo de magnitud 8 comparado con uno de magnitud 7 libera…', options: ['≈ 32 veces más energía', 'el doble de energía', '10 % más energía', 'la misma energía'], answer: 0, why: 'La escala es logarítmica.' }
    ],
    help: { intro: 'Elige un tipo de borde de placas en «Lab» o genera un sismo para ver cómo se propagan las ondas P y S hasta una estación.', items: [['Bordes', 'convergente (subducción), divergente (dorsal) y transformante (falla).'], ['Sismo', 'esfera azul: onda P; roja: onda S; cilindro verde: estación sismológica.'], ['Gráficos', 'sismograma y energía según la magnitud, con los grandes sismos chilenos.']], try: ['Aleja la estación: ¿cómo cambia el retraso S − P?', 'Compara los tres tipos de borde: ¿dónde hay volcanes?', 'Sube la magnitud de 7 a 9: ¿cuántas veces más energía?'] }
  };
  MSim.create(def);
})();
