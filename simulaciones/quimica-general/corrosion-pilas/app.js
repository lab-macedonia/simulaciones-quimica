/* Corrosión y protección del hierro — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var E = { fe: -0.44, zn: -0.76, sn: -0.14, cu: 0.34, mg: -2.37 };
  var CO = { none: { n: 'Hierro desnudo', m: null }, zn: { n: 'Galvanizado (Zn)', m: 'zn', c: 0x9fb0c8 }, sn: { n: 'Hojalata (Sn)', m: 'sn', c: 0xdee2e6 }, cu: { n: 'Cobreado (Cu)', m: 'cu', c: 0xd9822b }, mg: { n: 'Ánodo de sacrificio (Mg)', m: 'mg', c: 0xe9ecef } };
  var PILA = [['Zn–C (seca)', 1.5, 'Zn | MnO₂'], ['Alcalina', 1.5, 'Zn | MnO₂ (KOH)'], ['Ni–MH', 1.2, 'MH | NiOOH'], ['Plomo-ácido (celda)', 2.0, 'Pb | PbO₂'], ['Ion-litio', 3.7, 'LiC₆ | LiCoO₂']];
  var S = { coat: 'none', salt: 1, o2: 70, ph: 7, t: 0 }, g = null, fe2 = [], oh = [], el = [], rust = [], plate = null, coatM = null, lab = [], anodeMesh = null, drop = null;
  function anode() { var c = CO[S.coat].m; if (!c) return 'fe'; return E[c] < E.fe ? c : 'fe'; }
  function ecat() { return 1.23 - 0.0592 * S.ph; }
  function rate() { var a = anode(), drive = ecat() - E[a]; return drive * (0.15 + 0.85 * Math.min(1, S.salt / 2)) * (0.1 + 0.9 * S.o2 / 100); }
  function feRate() { if (S.coat === 'none') return rate(); var c = CO[S.coat].m; if (anode() === 'fe') return rate() * (c === 'cu' ? 1.4 : 1.2); return 0; }
  var NM = { fe: 'Fe', zn: 'Zn', sn: 'Sn', cu: 'Cu', mg: 'Mg' };
  function stages() {
    return [
      ['La corrosión es una pila', 'Pila', 'En la gota hay un ánodo (Fe → Fe²⁺ + 2e⁻) y un cátodo (O₂ + 2H₂O + 4e⁻ → 4OH⁻)',
        '<p>El hierro se corroe como una <b>pila galvánica</b> en miniatura. El centro de la gota, pobre en O₂, es el <b>ánodo</b>: <b>Fe → Fe²⁺ + 2e⁻</b>. Los electrones viajan por el metal hasta el borde, rico en O₂, el <b>cátodo</b>: <b>O₂ + 2H₂O + 4e⁻ → 4OH⁻</b>. Fe²⁺ y OH⁻ se encuentran y forman <b>herrumbre</b>, Fe(OH)₃ / Fe₂O₃·nH₂O.</p>'],
      ['Sal, oxígeno y pH', 'Factores', 'La sal aumenta la conductividad; el O₂ es el oxidante; un pH bajo favorece la reducción',
        '<p>La <b>sal</b> aumenta la conductividad del electrolito y acelera la corrosión; el <b>oxígeno</b> disuelto es el oxidante; un <b>pH ácido</b> eleva el potencial de reducción del O₂ (E = 1,23 − 0,059·pH). Sin humedad o sin O₂ casi no hay corrosión. Cambia los controles y observa el índice de velocidad.</p>'],
      ['Recubrimientos', 'Recubrimientos', 'Zn protege aunque se raye; Sn protege solo mientras esté intacto',
        '<p>Un <b>recubrimiento</b> aísla el hierro del ambiente. Si se raya, se forma una pila entre ambos metales: el <b>más activo (menor E°) se oxida</b>. El <b>Zn</b> (−0,76 V) protege al Fe (−0,44 V) y se corroe él; el <b>Sn</b> (−0,14 V) o el <b>Cu</b> (+0,34 V) son <b>menos activos</b> y, al rayarse, aceleran la corrosión del hierro.</p>'],
      ['Ánodo de sacrificio', 'Sacrificio', 'Un metal más activo conectado al hierro se corroe en su lugar',
        '<p>Un bloque de <b>Mg</b> (−2,37 V) conectado a una estructura de hierro actúa como <b>ánodo de sacrificio</b>: se oxida él y el hierro pasa a ser cátodo (<b>protección catódica</b>). Se usa en cascos de barcos y tuberías enterradas; el bloque debe reemplazarse cuando se consume.</p>']
    ];
  }
  var def = {
    key: 'corrosion-pilas', title: 'Corrosión y protección del hierro', subtitle: 'Simulador 3D · química general', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [13, 10, 15], target: [13, 0, 0] }, { id: 'lateral', label: 'Lateral', pos: [13, 2, 22], target: [13, 1, 0] }],
    layers: [{ id: 'e', label: 'Electrones', icon: 'e⁻' }, { id: 'ion', label: 'Iones', icon: '±' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(17, 0, 0); ctx.scene.add(g); var i;
      plate = new T.Mesh(new T.BoxGeometry(14, 0.8, 8), new T.MeshStandardMaterial({ color: 0x868e96, metalness: 0.6, roughness: 0.4 })); g.add(plate);
      coatM = new T.Mesh(new T.BoxGeometry(14.05, 0.2, 8.05), new T.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 0.5, roughness: 0.4 })); coatM.position.y = 0.5; g.add(coatM);
      anodeMesh = new T.Mesh(new T.BoxGeometry(2, 1.5, 2), new T.MeshStandardMaterial({ color: 0xe9ecef, metalness: 0.4, roughness: 0.5 })); anodeMesh.position.set(-7.8, 0.6, 0); g.add(anodeMesh);
      drop = new T.Mesh(new T.SphereGeometry(4.5, 28, 14, 0, 6.283, 0, 1.2), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.35 })); drop.scale.y = 0.45; drop.position.y = 0.4; g.add(drop);
      for (i = 0; i < 30; i++) { var a = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshStandardMaterial({ color: 0xe8590c })); g.add(a); fe2.push(a); var b = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), new T.MeshStandardMaterial({ color: 0x22b8cf })); g.add(b); oh.push(b); var c = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x8a6d00 })); g.add(c); el.push(c); }
      for (i = 0; i < 60; i++) { var r = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0x8a3b12 })); g.add(r); rust.push(r); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k;
      if (!P.manual) { if (i === 0) { S.coat = 'none'; S.salt = 1; S.o2 = 70; S.ph = 7; } if (i === 1) { S.coat = 'none'; S.salt = 3 * f.local; S.o2 = 100 - 60 * f.local; S.ph = 7 - 3 * Math.sin(f.local * 3.14); } if (i === 2) { S.coat = f.local < 0.5 ? 'zn' : 'sn'; S.salt = 2; S.o2 = 80; S.ph = 7; } if (i === 3) { S.coat = 'mg'; S.salt = 2; S.o2 = 80; S.ph = 7; } }
      var a = anode(), r = rate(), fr = feRate(), cm = CO[S.coat], on = ctx.layer('e'), ion = ctx.layer('ion'); S.t += dt * Math.max(0, r);
      coatM.visible = !!cm.m && S.coat !== 'mg'; if (cm.c) coatM.material.color.setHex(cm.c); anodeMesh.visible = S.coat === 'mg';
      var nI = Math.round(Math.max(0, Math.min(30, r * 14))), th = ctx.now;
      fe2.forEach(function (m, j) { m.visible = ion && j < nI && a === 'fe'; var u = (th * 0.4 + j / 30) % 1; m.position.set(-1 + Math.cos(j * 2.3) * u * 3, 0.6 + u * 1.6, Math.sin(j * 2.3) * u * 3); m.material.color.setHex(0xe8590c); });
      oh.forEach(function (m, j) { m.visible = ion && j < nI; var u = (th * 0.4 + j / 30) % 1, ang = j * 2.1; m.position.set(Math.cos(ang) * (3.3 + u * 0.8), 0.6 + u * 0.8, Math.sin(ang) * (3.3 + u * 0.8)); });
      el.forEach(function (m, j) { m.visible = on && j < nI; var u = (th * 0.5 + j / 30) % 1, ang = j * 2.3; m.position.set(Math.cos(ang) * (0.5 + u * 3.5), 0.45, Math.sin(ang) * (0.5 + u * 3.5)); });
      var nR = Math.min(60, Math.round(S.t * (fr > 0 ? 1 : 0) * 6)); rust.forEach(function (m, j) { m.visible = fr > 0 && j < nR; var ang = j * 2.4, rr = 1 + (j % 7) * 0.5; m.position.set(Math.cos(ang) * rr, 0.45 + 0.01 * j, Math.sin(ang) * rr); });
      lab[0].pos(17, 5.2, 0).set('Ánodo: ' + NM[a] + ' → ' + NM[a] + (a === 'fe' ? '²⁺' : '²⁺') + ' + 2e⁻', 'bl-neg').vis(true);
      lab[1].pos(22, 3.2, 0).set('Cátodo: O₂ + 2H₂O + 4e⁻ → 4OH⁻', 'bl-pos').vis(true);
      lab[2].pos(17, -3.6, 0).set(cm.n + ' · ' + (a === 'fe' ? 'el hierro se corroe' : 'el Fe está protegido'), a === 'fe' ? 'bl-neg' : 'bl-pos').vis(true);
      lab[3].pos(17, -5.2, 0).set('Índice de corrosión del Fe: ' + fmt(fr * 10, 1), 'bl-d').vis(true);
      lab[4].pos(9.2, 2.6, 0).set('Mg', 'bl-d').vis(S.coat === 'mg');
    },
    sync: function (ctx) { var u = ctx.ui; if (u.coat) u.coat.set(S.coat); ['salt', 'o2', 'ph'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var a = anode(); return { eq: { chip: 'E°', name: 'Pila de corrosión', body: '<div class="eqline"><small>Ánodo</small>' + NM[a] + ' (' + fmt(E[a], 2) + ' V)</div><div class="eqline"><small>E(O₂/OH⁻)</small>' + fmt(ecat(), 2) + ' V</div><div class="eqline"><small>ΔE</small>' + fmt(ecat() - E[a], 2) + ' V</div><div class="eqline"><small>Corrosión del Fe</small>' + fmt(feRate() * 10, 1) + '</div>' }, legend: [{ label: 'Naranja', color: '#e8590c', text: 'Fe²⁺ disolviéndose' }, { label: 'Cian', color: '#22b8cf', text: 'OH⁻ en el cátodo' }, { label: 'Amarillo', color: '#ffd43b', text: 'electrones' }] }; },
    measures: function () { var a = anode(); return [['Recubrimiento', CO[S.coat].n], ['Se oxida', NM[a]], ['E° ánodo', fmt(E[a], 2) + ' V'], ['E (O₂/OH⁻)', fmt(ecat(), 2) + ' V'], ['Fuerza motriz', fmt(ecat() - E[a], 2) + ' V'], ['Corrosión del Fe', feRate() > 0 ? fmt(feRate() * 10, 1) : 'protegido']]; },
    ideas: ['El metal más activo (menor E°) se oxida.', 'Sal y O₂ aceleran la corrosión.', 'Zn protege; Sn y Cu no, si hay rayas.', 'Ánodo de sacrificio = protección catódica.'],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Condiciones'); el2.appendChild(c);
      ui.coat = kit.ui.options({ label: 'Recubrimiento', cols: 1, value: S.coat, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n, sub: CO[k].m ? 'E° = ' + fmt(E[CO[k].m], 2) + ' V' : 'E° Fe = −0,44 V' }; }), onChange: function (v) { ctx.goManual(); S.coat = v; S.t = 0; } });
      ui.salt = kit.ui.slider({ label: 'Sal (NaCl)', min: 0, max: 3, step: 0.1, value: S.salt, format: function (v) { return fmt(v, 1) + ' %'; }, onInput: function (v) { ctx.goManual(); S.salt = v; } });
      ui.o2 = kit.ui.slider({ label: 'Oxígeno disuelto', min: 0, max: 100, step: 5, value: S.o2, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.o2 = v; } });
      ui.ph = kit.ui.slider({ label: 'pH', min: 2, max: 12, step: 0.5, value: S.ph, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.ph = v; } });
      c.appendChild(ui.coat); c.appendChild(kit.ui.sliders([ui.salt, ui.o2, ui.ph])); c.appendChild(ctx.btnRow([{ t: 'Reiniciar herrumbre', fn: function () { S.t = 0; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Potenciales estándar de reducción', h: 210, note: 'Metal más activo = más negativo = se oxida primero.', draw: function (cx, w, h, col) {
      var ks = ['mg', 'zn', 'fe', 'sn', 'cu'], L = 40, R = 10, Tp = 10, B = 24, pw = w - L - R, ph = h - Tp - B, y0 = Tp + ph * (2.4 / 2.9), bw = pw / ks.length - 8;
      ks.forEach(function (k, j) { var v = E[k], x = L + j * (bw + 8) + 4, y = Tp + ph * ((0.5 - v) / 2.9); cx.fillStyle = v < E.fe ? '#51cf66' : (v === E.fe ? '#ff922b' : '#ff6b6b'); cx.fillRect(x, Math.min(y, Tp + ph * (0.5 / 2.9)), bw, Math.abs(y - (Tp + ph * (0.5 / 2.9)))); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(NM[k] + ' ' + fmt(v, 2), x + bw / 2, h - 8); });
    } }],
    calc: function () {
      var a = anode(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; }, pl = PILA.map(function (p) { return p[0] + ': ' + fmt(p[1], 1) + ' V (' + p[2] + ')'; }).join('<br>');
      return '<div class="card-kicker">' + CO[S.coat].n + ' · pH ' + fmt(S.ph, 1) + '</div><table class="calc-table">' + row('Ánodo', NM[a] + ' → ' + NM[a] + '²⁺ + 2e⁻ (E° = ' + fmt(E[a], 2) + ' V)') + row('E(O₂/OH⁻)', '1,23 − 0,0592·' + fmt(S.ph, 1) + ' = <b>' + fmt(ecat(), 2) + ' V</b>') + row('ΔE', fmt(ecat(), 2) + ' − (' + fmt(E[a], 2) + ') = <b>' + fmt(ecat() - E[a], 2) + ' V</b>') + row('Estado del Fe', a === 'fe' ? 'se corroe' : 'protegido catódicamente') + row('Pilas comerciales', pl) + '</table>';
    },
    quiz: [
      { q: 'En la corrosión del hierro, el cátodo es la zona donde…', options: ['se reduce el O₂', 'se oxida el Fe', 'se forma H₂ siempre', 'no hay electrones'], answer: 0, why: 'O₂ + 2H₂O + 4e⁻ → 4OH⁻.' },
      { q: 'El hierro galvanizado con Zn, aunque se raye…', options: ['sigue protegido: el Zn se oxida', 'se corroe más rápido', 'no cambia', 'forma Zn metálico'], answer: 0, why: 'E°(Zn) < E°(Fe).' },
      { q: 'La hojalata (Sn) rayada…', options: ['acelera la corrosión del Fe', 'protege al Fe', 'no se ve afectada', 'elimina el oxígeno'], answer: 0, why: 'El Sn es menos activo que el Fe.' },
      { q: 'La sal aumenta la corrosión porque…', options: ['mejora la conductividad del electrolito', 'es un oxidante fuerte', 'baja la temperatura', 'forma un recubrimiento'], answer: 0, why: 'Facilita el paso de iones.' },
      { q: 'Un ánodo de sacrificio debe ser…', options: ['más activo que el hierro', 'menos activo que el hierro', 'un aislante', 'inerte'], answer: 0, why: 'Ejemplo: Mg o Zn.' },
      { q: 'Si disminuye el pH, el potencial del O₂/OH⁻…', options: ['aumenta', 'disminuye', 'no cambia', 'se anula'], answer: 0, why: 'E = 1,23 − 0,0592·pH.' }
    ],
    help: { intro: 'Elige el recubrimiento y ajusta sal, oxígeno y pH. Se muestran las semirreacciones y el índice de corrosión. «Reiniciar herrumbre» borra la acumulación.', items: [['Escena', 'esferas naranjas = Fe²⁺ que se disuelve (ánodo); cian = OH⁻ en el cátodo; amarillas = electrones; las manchas marrones son la herrumbre acumulada.'], ['Controles', '«Recubrimiento» (por ejemplo Zn, Sn o Mg), «Sal (NaCl)», «Oxígeno disuelto» y «pH»; el panel muestra las semirreacciones y el índice de corrosión. «Reiniciar herrumbre» la borra.'], ['Gráfico', '«Potenciales estándar de reducción»: el metal de menor E° es el que se oxida.']], try: ['Sube la sal y el oxígeno: la corrosión se acelera.', 'Compara Zn y Sn como recubrimiento rayado: el Zn sigue protegiendo; el Sn acelera la corrosión del Fe.', 'Prueba un ánodo de sacrificio de Mg: se oxida él y el hierro queda protegido.'] }
  };
  MSim.create(def);
})();
