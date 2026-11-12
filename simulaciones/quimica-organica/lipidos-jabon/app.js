/* Lípidos, saponificación y jabones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var S = { n: 16, d: 0, naoh: 100, soap: 0.02, ca: 0, sap: 0 }, g = null, chains = [], heads = [], tails = [], grease = null, lab = [], gly = null, na = [];
  function Mac() { return 12.011 * S.n + 1.008 * (2 * S.n - 2 * S.d) + 31.998; }
  function Mtg() { return 92.094 + 3 * Mac() - 3 * 18.015; }
  function Tm() { var t = 44 + 4.7 * (S.n - 12); [55, 20, 10].forEach(function (x, k) { if (k < S.d) t -= x; }); return t; }
  function SAP() { return 3 * 56108 / Mtg(); }
  function stages() {
    return [
      ['Triglicérido', 'Triglicérido', 'Glicerol + 3 ácidos grasos unidos por enlaces éster',
        '<p>Las grasas y aceites son <b>triglicéridos</b>: un glicerol esterificado con tres <b>ácidos grasos</b>. Los ácidos <b>saturados</b> tienen cadenas rectas que se empaquetan bien (sólidos, punto de fusión alto); cada doble enlace <b>cis</b> introduce un <b>codo</b> que dificulta el empaquetamiento y baja el punto de fusión (aceites). Cambia el largo de cadena y las insaturaciones.</p>'],
      ['Saponificación', 'Saponificación', 'Triglicérido + 3 NaOH → glicerol + 3 jabones (sales de ácido graso)',
        '<p>La <b>saponificación</b> es la hidrólisis básica de los ésteres: <b>triglicérido + 3 NaOH → glicerol + 3 RCOO⁻Na⁺</b>. El jabón es la sal sódica del ácido graso. El <b>índice de saponificación</b> (mg de KOH por g de grasa) = 3·56 108 / M<sub>triglicérido</sub> indica cuánta base se necesita.</p>'],
      ['Micelas', 'Micelas', 'Cola hidrofóbica adentro, cabeza iónica afuera',
        '<p>El jabón es <b>anfifílico</b>: una <b>cabeza iónica</b> (–COO⁻) soluble en agua y una <b>cola hidrocarbonada</b> insoluble. Sobre la <b>concentración micelar crítica</b> se agrupan en <b>micelas</b>: las colas rodean y atrapan la grasa, las cabezas miran al agua. Así la grasa se emulsiona y se arrastra con el agua.</p>'],
      ['Agua dura', 'Agua dura', 'Ca²⁺ y Mg²⁺ precipitan el jabón',
        '<p>En <b>agua dura</b> hay Ca²⁺ y Mg²⁺ que forman sales insolubles con el jabón: <b>2 RCOO⁻ + Ca²⁺ → (RCOO)₂Ca↓</b> (la «nata»). Se pierde jabón y la limpieza empeora. Los <b>detergentes sintéticos</b> (sulfonatos) no precipitan con Ca²⁺.</p>']
    ];
  }
  var def = {
    key: 'lipidos-jabon', title: 'Lípidos, saponificación y jabones', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ffd43b', light: '#b45309' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [11, 5, 19], target: [11, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [11, 1, 22], target: [11, 1, 0] }],
    layers: [{ id: 'mic', label: 'Micela', icon: '◍' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, j;
      gly = new T.Group(); for (i = 0; i < 3; i++) { var gc = new T.Mesh(new T.SphereGeometry(0.4, 12, 9), new T.MeshStandardMaterial({ color: 0xff922b })); gc.position.set(0, 1.6 * (1 - i), 0); gly.add(gc); } g.add(gly);
      for (i = 0; i < 3; i++) { var ch = []; for (j = 0; j < 20; j++) { var s = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshStandardMaterial({ color: 0x56606b })); g.add(s); ch.push(s); } chains.push(ch); }
      for (i = 0; i < 48; i++) { var h = new T.Mesh(new T.SphereGeometry(0.34, 10, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(h); heads.push(h); var t = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 1, 6), new T.MeshStandardMaterial({ color: 0x868e96 })); g.add(t); tails.push(t); }
      grease = new T.Mesh(new T.SphereGeometry(1.2, 18, 14), new T.MeshStandardMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9 })); g.add(grease);
      for (i = 0; i < 12; i++) { var c = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), new T.MeshStandardMaterial({ color: 0xff6b6b })); g.add(c); na.push(c); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.n = 12 + Math.round(6 * f.local); S.d = Math.floor(f.local * 3.99); S.sap = 0; S.ca = 0; } if (i === 1) { S.n = 16; S.d = 0; S.sap = f.local; S.ca = 0; } if (i === 2) { S.sap = 1; S.soap = 0.001 + 0.03 * f.local; S.ca = 0; } if (i === 3) { S.sap = 1; S.soap = 0.02; S.ca = f.local; } } else { S.sap = Math.max(S.sap, 0); }
      var th = ctx.now, stg = P.manual ? 4 : i, sapv = S.sap, mic = ctx.layer('mic') && (stg >= 2), tri = (stg < 2 || (stg === 1 && sapv < 1));
      var ch0 = Math.max(0, 1 - sapv * 1.0), cx0 = 8;
      gly.position.set(cx0 + sapv * 0.6, 0, 0); gly.visible = stg <= 1 || (P.manual);
      chains.forEach(function (ch, k) {
        ch.forEach(function (s, j) { s.visible = j < S.n + 2 && (stg <= 1 || P.manual) && stg < 2; var kink = (S.d > k || (S.d > 0 && k === 0)) && j > 5 && j < 9 ? 0.55 : 0; var zz = (j % 2 ? 0.2 : -0.2); var jj = j + (sapv * 1.2 * 0); s.position.set(cx0 + 0.7 + j * 0.45 + sapv * (3 + k * 0.5), 1.6 * (1 - k) + zz + (j > 5 && kink ? 0.55 : 0) + (j > 8 && S.d > k ? 0.3 : 0) - sapv * 0 + (j > 5 && j < 9 ? 0 : 0), 0); s.material.color.setHex(S.d > k && j > 5 && j < 9 ? 0xff8787 : 0x56606b); });
      });
      na.forEach(function (c, k) { c.visible = stg === 1 && k < 3 + Math.round(9 * sapv); c.position.set(cx0 + 3 + (k % 4) * 1.4, -2.2 - Math.floor(k / 4) * 0.8, 0); });
      var nH = mic ? 40 : 0, R = 3.2, ox = 15, oy = 1.5;
      heads.forEach(function (h, k) { var vis = (stg >= 2) && ctx.layer('mic') && k < nH && S.soap > 0.004; h.visible = vis; var y = 1 - 2 * (k + 0.5) / nH, r = Math.sqrt(Math.max(0, 1 - y * y)), phi = k * 2.399963 + th * 0.15, dx = Math.cos(phi) * r, dz = Math.sin(phi) * r; h.position.set(ox + dx * R, oy + y * R, dz * R); var tl = tails[k]; tl.visible = vis; var len = 1.8; tl.position.set(ox + dx * (R - len / 2 - 0.2), oy + y * (R - len / 2 - 0.2), dz * (R - len / 2 - 0.2)); tl.scale.set(1, len, 1); tl.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, y, dz)); h.material.color.setHex(S.ca > 0.5 ? 0xff8787 : 0x4dabf7); });
      grease.visible = stg >= 2 && ctx.layer('mic') && S.soap > 0.004; grease.position.set(ox, oy, 0); grease.scale.setScalar(1 - 0.4 * S.ca);
      lab[0].pos(cx0 + 4, 4.6, 0).set(stg < 2 ? 'Triglicérido: C' + S.n + ':' + S.d + ' × 3' : (stg === 2 ? 'Micela de jabón' : 'Jabón + Ca²⁺ (agua dura)'), 'bl-lead').vis(true).pos(stg < 2 ? cx0 + 4 : ox, stg < 2 ? 4.6 : 6.4, 0);
      lab[1].pos(cx0 + 4, -4.2, 0).set(stg < 2 ? 'Pf ≈ ' + fmt(Tm(), 0) + ' °C · M = ' + fmt(Mtg(), 0) + ' g/mol' : '', 'bl-d').vis(stg < 2);
      lab[2].pos(ox, -3.8, 0).set(stg === 2 ? (S.soap > 0.004 ? 'sobre la CMC: micelas' : 'bajo la CMC: monómeros') : (stg >= 3 ? fmt(S.ca * 100, 0) + ' % del jabón precipita' : ''), 'bl-d').vis(stg >= 2);
      lab[3].pos(cx0 + 4, 3, 0).set(stg === 1 ? 'NaOH: ' + fmt(S.sap * 3, 1) + ' / 3 mol' : '', 'bl-pos').vis(stg === 1);
    },
    sync: function (ctx) { var u = ctx.ui; ['n', 'd', 'soap', 'ca'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'TG', name: 'Grasa', body: '<div class="eqline"><small>Ácido graso</small>C' + S.n + ':' + S.d + '</div><div class="eqline"><small>M triglicérido</small>' + fmt(Mtg(), 0) + ' g/mol</div><div class="eqline"><small>Punto de fusión</small>' + fmt(Tm(), 0) + ' °C</div><div class="eqline"><small>Índice saponif.</small>' + fmt(SAP(), 0) + ' mg KOH/g</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'cabeza iónica (hidrófila)' }, { label: 'Gris', color: '#868e96', text: 'cola hidrocarbonada' }, { label: 'Amarillo', color: '#ffd43b', text: 'grasa atrapada' }] }; },
    measures: function () { return [['Ácido graso', 'C' + S.n + ':' + S.d], ['M triglicérido', fmt(Mtg(), 1) + ' g/mol'], ['Punto de fusión', '≈ ' + fmt(Tm(), 0) + ' °C'], ['Estado a 25 °C', Tm() > 25 ? 'sólido (grasa)' : 'líquido (aceite)'], ['Índice de saponificación', fmt(SAP(), 0) + ' mg KOH/g'], ['NaOH por 100 g', fmt(SAP() / 56.108 * 40.0 / 1000 * 100, 1) + ' g']]; },
    ideas: ['Cada C=C cis baja el punto de fusión.', 'Triglicérido + 3 NaOH → glicerol + 3 jabón.', 'Micela: cola adentro, cabeza afuera.', 'Ca²⁺ precipita el jabón.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Ácido graso y jabón'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; if (k === 'd' || k === 'n') S.sap = 0; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('n', 'Átomos de C del ácido graso', 12, 18, 2, function (v) { return 'C' + v; }), sl('d', 'Dobles enlaces cis', 0, 3, 1, function (v) { return String(v); }), sl('soap', 'Jabón en agua', 0.001, 0.04, 0.001, function (v) { return fmt(v, 3) + ' M'; }), sl('ca', 'Dureza (Ca²⁺ precipitando)', 0, 1, 0.05, function (v) { return fmt(v * 100, 0) + ' %'; })]));
      c.appendChild(ctx.btnRow([{ t: 'Saponificar', fn: function () { ctx.goManual(); S.sap = 1; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Punto de fusión según insaturaciones', h: 200, note: 'Cada doble enlace cis baja el punto de fusión de forma marcada.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, d, n = S.n, bw = pw / 4; cx.font = '10px system-ui'; cx.textAlign = 'center';
      for (d = 0; d < 4; d++) { var t = 44 + 4.7 * (n - 12); [55, 20, 10].forEach(function (x, k) { if (k < d) t -= x; }); var y0 = Tp + ph * (80 / 110), y = Tp + ph * ((80 - t) / 110); cx.fillStyle = d === S.d ? '#ff922b' : '#74c0fc'; cx.fillRect(L + d * bw + 8, Math.min(y, y0), bw - 16, Math.abs(y0 - y)); cx.fillStyle = col.muted; cx.fillText('C' + n + ':' + d, L + d * bw + bw / 2, h - 10); cx.fillText(fmt(t, 0), L + d * bw + bw / 2, (t >= 0 ? y : y0) + (t >= 0 ? -3 : 12)); }
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">Triglicérido de ácido C' + S.n + ':' + S.d + '</div><table class="calc-table">' + row('M ácido graso', '<b>' + fmt(Mac(), 2) + ' g/mol</b>') + row('M triglicérido', '92,09 + 3·' + fmt(Mac(), 2) + ' − 3·18,015 = <b>' + fmt(Mtg(), 1) + ' g/mol</b>') + row('Índice de saponificación', '3·56 108 / ' + fmt(Mtg(), 1) + ' = <b>' + fmt(SAP(), 0) + ' mg KOH/g</b>') + row('NaOH por kg de grasa', fmt(3 * 40.0 / Mtg() * 1000, 0) + ' g') + row('Jabón (sal Na)', 'M = ' + fmt(Mac() + 21.98, 1) + ' g/mol') + '</table>'; },
    quiz: [
      { q: 'La saponificación de un triglicérido produce…', options: ['glicerol y jabón', 'glicerol y ácidos grasos libres', 'etanol y agua', 'un alcano'], answer: 0, why: 'Hidrólisis básica del éster.' },
      { q: 'Los ácidos grasos cis insaturados…', options: ['bajan el punto de fusión', 'lo suben', 'no lo cambian', 'forman jabón sin NaOH'], answer: 0, why: 'El codo dificulta el empaquetamiento.' },
      { q: 'En una micela, las colas hidrocarbonadas están…', options: ['hacia el interior', 'hacia el agua', 'en el agua dispersas', 'unidas a Ca²⁺'], answer: 0, why: 'Son hidrófobas.' },
      { q: 'El jabón pierde eficacia en agua dura porque…', options: ['forma sales insolubles con Ca²⁺ y Mg²⁺', 'se oxida', 'se hidroliza', 'forma micelas más grandes'], answer: 0, why: '(RCOO)₂Ca precipita.' },
      { q: 'Se necesitan… moles de NaOH por mol de triglicérido.', options: ['3', '1', '2', '6'], answer: 0, why: 'Una por cada éster.' },
      { q: 'Un índice de saponificación alto indica ácidos grasos…', options: ['de cadena corta', 'de cadena larga', 'saturados siempre', 'insaturados siempre'], answer: 0, why: 'Menor M ⇒ más ésteres por gramo.' }
    ],
    help: { intro: 'Cambia el ácido graso y observa el codo de las insaturaciones. Con «Saponificar» el triglicérido se rompe; más a la derecha ves la micela y el efecto del agua dura.', items: [['Cadena', 'gris = cola hidrocarbonada; cada codo rosado es un doble enlace cis.'], ['«Saponificar»', 'el triglicérido se rompe en glicerol y tres moléculas de jabón.'], ['Micela', 'azul = cabeza iónica (hidrófila), gris = cola; amarillo = grasa atrapada en el interior.'], ['Gráfico', '«Punto de fusión según insaturaciones».']], try: ['Agrega dobles enlaces al ácido graso: el punto de fusión baja.', 'Pulsa «Saponificar» y cuenta los productos: 1 glicerol + 3 jabones.', 'En la etapa de agua dura, observa cómo el Ca²⁺ y el Mg²⁺ precipitan el jabón.'] }
  };
  MSim.create(def);
})();
