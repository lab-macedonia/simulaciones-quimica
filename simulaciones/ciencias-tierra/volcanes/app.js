/* Volcanes y erupciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f0 = function (x) { return fmt(x, 0); };
  var EJ = [['Villarrica', 'estratovolcán, erupciones efusivas y lahares (2015)'], ['Calbuco', 'erupción explosiva subpliniana (2015)'], ['Chaitén', 'erupción explosiva riolítica (2008)'], ['Kīlauea (Hawái)', 'volcán en escudo, coladas de lava basáltica']];
  var S = { si: 50, gas: 2, ice: false, run: true, t: 0, alert: 0 };
  var NP = 420, P = [], pts, G = {}, lab = {}, H = 4.2, R = 5;
  function visc() { return Math.pow(10, (S.si - 45) / 30 * 7 + 1); }   // Pa·s aproximado: 10 (basalto) a 10⁸ (riolita)
  function expl() { return clamp((S.si - 52) / 18 * 0.7 + (S.gas - 1) / 5 * 0.5, 0, 1); }
  function vei() { return Math.round(clamp(expl() * 6 + 0.3, 0, 6)); }
  function type() { var e = expl(); return e < 0.25 ? 'efusiva' : e < 0.6 ? 'mixta' : 'explosiva'; }
  function rock() { return S.si < 52 ? 'basalto' : S.si < 63 ? 'andesita' : S.si < 69 ? 'dacita' : 'riolita'; }
  function surfY(r) { return H * (1 - r / R); }
  function stages() {
    return [
      ['Estructura de un volcán', 'Estructura', 'Cámara magmática, chimenea, cráter y cono',
        '<p>Un <b>volcán</b> es una abertura por donde sale <b>magma</b> (roca fundida con gases disueltos) desde el interior. El magma se acumula en una <b>cámara magmática</b> a algunos kilómetros de profundidad, sube por la <b>chimenea</b> y sale por el <b>cráter</b>. Al acumularse lava y cenizas erupción tras erupción se construye el <b>cono</b>. Fuera del volcán, el magma se llama <b>lava</b>.</p>'],
      ['Erupción efusiva', 'Efusiva', 'Magma fluido y pobre en gases: coladas de lava',
        '<p>Si el magma tiene <b>poca sílice</b> (basáltico) es <b>fluido</b> (baja viscosidad) y los gases escapan con facilidad. La erupción es <b>efusiva</b>: la lava se derrama en <b>coladas</b> que bajan por las laderas, como en Hawái. Son espectaculares pero, en general, menos peligrosas para las personas, porque avanzan lentamente.</p>'],
      ['Erupción explosiva', 'Explosiva', 'Magma viscoso y rico en gases: columna de ceniza y piroclastos',
        '<p>Con <b>mucha sílice</b> (andesítico o riolítico) el magma es muy <b>viscoso</b> y atrapa los gases. Al subir, la presión baja y los gases se expanden de golpe, como al abrir una bebida agitada: la erupción es <b>explosiva</b> y lanza una <b>columna de ceniza</b> de varios kilómetros, <b>piroclastos</b> y flujos piroclásticos. El índice de explosividad (<b>IEV</b>) va de 0 a 8.</p>'],
      ['Peligros volcánicos', 'Peligros', 'Coladas, caída de ceniza, lahares y gases',
        '<p>Además de la lava, una erupción produce <b>caída de ceniza</b> (daña pulmones, cultivos, motores y techos), <b>flujos piroclásticos</b> (nubes ardientes muy rápidas), <b>gases</b> tóxicos y <b>lahares</b>: aluviones de barro que se forman cuando el calor <b>derrite el glaciar</b> de la cumbre, como ocurre en el Villarrica. Los lahares siguen los cauces de los ríos y pueden llegar lejos.</p>'],
      ['Volcanes de Chile', 'Chile', 'Chile tiene unos 90 volcanes activos vigilados por el SERNAGEOMIN',
        '<p>Por la subducción de la placa de Nazca, Chile tiene unos <b>90 volcanes geológicamente activos</b>. El <b>SERNAGEOMIN</b> los vigila y emite una <b>alerta técnica</b> (verde, amarilla, naranja o roja) según su actividad: sismos, deformación, gases. Ejemplos recientes: Chaitén (2008), Calbuco (2015) y Villarrica (2015). Conocer las vías de evacuación es parte de la prevención.</p>'],
      ['Beneficios de los volcanes', 'Beneficios', 'Suelos fértiles, energía geotérmica y turismo',
        '<p>Los volcanes también aportan: las cenizas meteorizadas forman <b>suelos fértiles</b>; el calor del interior permite la <b>energía geotérmica</b> (en Chile, la planta Cerro Pabellón, en Antofagasta) y las <b>termas</b>; y sus paisajes atraen <b>turismo</b>. Además, los gases volcánicos formaron la atmósfera y los océanos primitivos de la Tierra.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.ice = false; S.alert = 0;
    if (i === 0) { S.si = 50; S.gas = 1; S.run = false; }
    else if (i === 1) { S.si = 48; S.gas = 1.5; S.run = true; }
    else if (i === 2) { S.si = 66; S.gas = 5; S.run = true; }
    else if (i === 3) { S.si = 56; S.gas = 3; S.run = true; S.ice = true; }
    else if (i === 4) { S.si = 58; S.gas = 3; S.run = l > 0.3; S.alert = Math.min(3, Math.floor(l * 4)); }
    else { S.si = 50; S.gas = 1; S.run = false; }
  }
  function spawn(p) { p.age = 0; p.kind = expl() > Math.random() * 1.1 ? 'ash' : 'lava'; if (S.ice && Math.random() < 0.25) p.kind = 'lahar'; var a = Math.random() * Math.PI * 2; p.a = a; p.r = 0.3; p.y = H; p.vy = p.kind === 'ash' ? 2.5 + 4 * expl() + Math.random() * 2 : 0; p.vr = p.kind === 'ash' ? 0.2 + Math.random() * 0.6 : 0.15 + 0.6 * (1 - (S.si - 45) / 30) + Math.random() * 0.2; if (p.kind === 'lahar') { p.a = 0.6 + Math.random() * 0.25; p.vr = 1.4; } }
  var def = {
    key: 'volcanes', title: 'Volcanes y erupciones', subtitle: 'Simulador 3D · ciencias de la Tierra', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-2.5, 7, 21], target: [-2.5, 3.2, 0] }, { id: 'corte', label: 'Corte', pos: [-2.5, 2.5, 21], target: [-2.5, 1.8, 0] }],
    layers: [{ id: 'int', label: 'Interior (corte)', icon: '◐' }],
    build: function (ctx) {
      var s = ctx.scene; G.cone = new T.Mesh(new T.ConeGeometry(R, H, 48, 1, true), new T.MeshStandardMaterial({ color: 0x6d5a4d, roughness: 0.95, transparent: true, opacity: 0.55, side: T.DoubleSide })); G.cone.position.y = H / 2; s.add(G.cone);
      var ground = new T.Mesh(new T.CylinderGeometry(7.5, 7.5, 0.2, 48), new T.MeshStandardMaterial({ color: 0x5c7c3a, roughness: 1 })); ground.position.y = -0.1; s.add(ground);
      var under = new T.Mesh(new T.CylinderGeometry(7.5, 7.5, 3.6, 48, 1, true), new T.MeshStandardMaterial({ color: 0x7a5c48, side: T.DoubleSide, transparent: true, opacity: 0.25, depthWrite: false })); under.position.y = -1.9; s.add(under);
      G.ch = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: 0xff6b2b, emissive: 0x8a2a00 })); G.ch.scale.set(2.2, 0.9, 1.6); G.ch.position.y = -2.4; s.add(G.ch);
      G.cond = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, H + 2.4, 12), new T.MeshStandardMaterial({ color: 0xff8c42, emissive: 0x7a2a00 })); G.cond.position.y = (H - 2.4) / 2; s.add(G.cond);
      G.ice = new T.Mesh(new T.ConeGeometry(1.5, 1.25, 32), new T.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.4 })); G.ice.position.y = H - 0.55; s.add(G.ice);
      var pos = new Float32Array(NP * 3), col = new Float32Array(NP * 3); for (var i = 0; i < NP; i++) { P.push({ age: 9, kind: 'lava' }); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      pts = new T.Points(g, new T.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.95 })); pts.frustumCulled = false; s.add(pts);
      G.flag = new T.Mesh(new T.BoxGeometry(0.9, 0.6, 0.05), new T.MeshBasicMaterial({ color: 0x51cf66 })); G.flag.position.set(-7, 2.4, 3); s.add(G.flag);
      var pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.4, 6), new T.MeshStandardMaterial({ color: 0xadb5bd })); pole.position.set(-7.45, 1.2, 3); s.add(pole);
      ['a', 'b', 'c', 'd', 'e'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var inner = ctx.layer('int'); G.ch.visible = G.cond.visible = inner; G.cone.material.opacity = inner ? 0.45 : 0.95; G.ice.visible = S.ice;
      G.flag.material.color.setHex([0x51cf66, 0xfcc419, 0xff922b, 0xfa5252][S.alert]);
      var pa = pts.geometry.attributes.position.array, ca = pts.geometry.attributes.color.array, ex = expl();
      for (var i = 0; i < NP; i++) {
        var p = P[i];
        if (p.age > (p.kind === 'ash' ? 6 : 8)) { if (S.run && Math.random() < 0.08 + ex * 0.2) spawn(p); else { pa[i * 3 + 1] = -50; continue; } }
        p.age += dt;
        if (p.kind === 'ash') { p.y += p.vy * dt; p.vy -= (p.y > H + 3 + 8 * ex ? 1.6 : 0.15) * dt; p.r += p.vr * dt * (p.y > H + 2 ? 1.6 : 0.5); if (p.y < surfY(Math.min(p.r, R))) p.age = 99; }
        else { p.r = Math.min(R + 2.5, p.r + p.vr * dt * (p.kind === 'lahar' ? 1 : 0.9 - 0.5 * clamp((p.r - 0.3) / R, 0, 1))); p.y = p.r < R ? surfY(p.r) + 0.12 : 0.08; }
        pa[i * 3] = Math.cos(p.a) * p.r; pa[i * 3 + 1] = p.y; pa[i * 3 + 2] = Math.sin(p.a) * p.r;
        var c = p.kind === 'ash' ? [0.55, 0.55, 0.58] : p.kind === 'lahar' ? [0.45, 0.33, 0.22] : [1, clamp(0.55 - p.age * 0.08, 0.1, 0.55), 0.1 * Math.max(0, 1 - p.age)];
        ca[i * 3] = c[0]; ca[i * 3 + 1] = c[1]; ca[i * 3 + 2] = c[2];
      }
      pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      lab.a.pos(0, H + 1 + (S.run ? 3 * ex : 0), 0).set(S.run ? 'Erupción ' + type() + ' · IEV ≈ ' + vei() : 'Volcán en reposo', S.run ? 'bl-warn' : 'bl-d').vis(true);
      if (inner) { lab.b.pos(3, -2.4, 0).set('Cámara magmática', 'bl-pos').vis(true); lab.c.pos(1.4, 1.4, 0).set('Chimenea', 'bl-d').vis(true); lab.d.pos(1.2, H + 0.2, 0).set('Cráter', 'bl-d').vis(!S.run); }
      if (S.ice) lab.e.pos(4.6, 1.2, 3).set('Lahar: barro del glaciar derretido', 'bl-lead').vis(true);
      if (ctx.f && ctx.f.i === 4 && !ctx.P.manual) lab.e.pos(-7, 3.2, 3).set('Alerta técnica ' + ['verde', 'amarilla', 'naranja', 'roja'][S.alert], 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.si && u.si.set(S.si); u.gas && u.gas.set(S.gas); } },
    hud: function () { return { eq: { chip: '▲', name: 'Magma ' + rock(), body: '<div class="eqline"><small>Sílice</small>' + f0(S.si) + ' % SiO₂</div><div class="eqline"><small>Viscosidad</small>≈ 10^' + f1(Math.log(visc()) / Math.LN10) + ' Pa·s</div><div class="eqline"><small>Gases</small>' + f1(S.gas) + ' %</div><div class="eqline"><small>Tipo</small>' + type() + '</div>' }, legend: [{ label: 'Naranja', color: '#ff922b', text: 'lava' }, { label: 'Gris', color: '#adb5bd', text: 'ceniza y piroclastos' }, { label: 'Café', color: '#8d6e4f', text: 'lahar (aluvión de barro)' }] }; },
    measures: function () { return [['Roca / magma', rock()], ['Sílice', f0(S.si) + ' %'], ['Gases disueltos', f1(S.gas) + ' %'], ['Viscosidad aprox.', '10^' + f1(Math.log(visc()) / Math.LN10) + ' Pa·s'], ['Tipo de erupción', type()], ['IEV aprox.', String(vei())], ['Columna de ceniza', S.run && expl() > 0.25 ? '≈ ' + f0(2 + 30 * expl()) + ' km' : '—']]; },
    ideas: ['Magma: roca fundida + gases; fuera del volcán se llama lava.', 'Poca sílice → fluido → erupción efusiva (coladas).', 'Mucha sílice y gases → viscoso → explosiva (ceniza).', 'Peligros: coladas, ceniza, flujos piroclásticos, lahares, gases.', 'Chile: ≈ 90 volcanes activos; alerta del SERNAGEOMIN.', 'Beneficios: suelos fértiles, geotermia, turismo.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Magma'); el.appendChild(c);
      ui.si = kit.ui.slider({ label: 'Sílice SiO₂ (%)', min: 45, max: 75, step: 1, value: S.si, digits: 0, onInput: function (v) { ctx.goManual(); S.si = v; } });
      ui.gas = kit.ui.slider({ label: 'Gases disueltos (%)', min: 0.5, max: 6, step: 0.1, value: S.gas, digits: 1, onInput: function (v) { ctx.goManual(); S.gas = v; } });
      c.appendChild(kit.ui.sliders([ui.si, ui.gas]));
      c.appendChild(ctx.btnRow([{ t: 'Erupción / reposo', primary: true, fn: function () { ctx.goManual(); S.run = !S.run; } }, { t: 'Glaciar sí / no', fn: function () { ctx.goManual(); S.ice = !S.ice; } }, { t: 'Subir alerta', fn: function () { ctx.goManual(); S.alert = (S.alert + 1) % 4; } }]));
      el.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var c2 = kit.ui.card('Volcanes de ejemplo'); c2.insertAdjacentHTML('beforeend', kit.ui.table(['Volcán', 'Características'], EJ)); el.appendChild(c2);
    },
    graphs: [
      { title: 'Tipo de erupción según sílice y gases', h: 230, note: 'Abajo a la izquierda: magmas fluidos y efusivos; arriba a la derecha: viscosos y explosivos. El punto es el magma actual.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, sx = function (s) { return L + pw * (s - 45) / 30; }, sy = function (g) { return Tp + ph - ph * (g - 0.5) / 5.5; }, i, j;
        for (i = 0; i < 30; i++) for (j = 0; j < 22; j++) { var si = 45 + i + 0.5, ga = 0.5 + j * 0.25 + 0.125, e = clamp((si - 52) / 18 * 0.7 + (ga - 1) / 5 * 0.5, 0, 1); cx.fillStyle = 'rgba(' + Math.round(255 * (0.5 + e / 2)) + ',' + Math.round(150 - 90 * e) + ',' + Math.round(60 + 80 * e) + ',.35)'; cx.fillRect(sx(45 + i), sy(0.75 + j * 0.25), pw / 30 + 1, ph / 22 + 1); }
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 45; i <= 75; i += 5) cx.fillText(i, sx(i), h - B + 13); cx.fillText('sílice (%)  ·  gases (%)', L + pw / 2, h - 3);
        cx.textAlign = 'right'; for (i = 1; i <= 6; i++) cx.fillText(i, L - 5, sy(i) + 3);
        cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText('efusiva', sx(46), sy(0.9)); cx.textAlign = 'right'; cx.fillText('explosiva', sx(74), sy(5.6));
        cx.fillStyle = '#fff'; cx.strokeStyle = '#c92a2a'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.si), sy(S.gas), 6, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      return '<div class="card-kicker">Magma ' + rock() + '</div><table class="calc-table">' + row('Sílice', f0(S.si) + ' % → ' + (S.si < 52 ? 'fluido' : S.si < 63 ? 'intermedio' : 'muy viscoso')) + row('Viscosidad', '≈ 10^' + f1(Math.log(visc()) / Math.LN10) + ' Pa·s (agua: 10⁻³; miel: 10)') + row('Gases', f1(S.gas) + ' % disueltos') + row('Erupción esperada', '<b>' + type() + '</b> · IEV ≈ ' + vei()) + row('Peligro principal', type() === 'efusiva' ? 'coladas de lava' : type() === 'mixta' ? 'ceniza y coladas' : 'columna de ceniza y flujos piroclásticos') + '</table>';
    },
    quiz: [
      { q: 'El magma que sale a la superficie se llama…', options: ['lava', 'ceniza', 'lahar', 'cráter'], answer: 0, why: 'Magma bajo tierra, lava en la superficie.' },
      { q: 'Un magma pobre en sílice produce erupciones…', options: ['efusivas, con coladas de lava', 'muy explosivas', 'sin lava', 'de agua'], answer: 0, why: 'Es fluido y los gases escapan fácilmente.' },
      { q: 'Las erupciones más explosivas tienen magma…', options: ['viscoso y rico en gases', 'fluido y sin gases', 'frío y sólido', 'de agua salada'], answer: 0, why: 'Los gases atrapados se expanden de golpe.' },
      { q: 'Un lahar es…', options: ['un aluvión de barro y agua de deshielo', 'una colada de lava', 'una nube de gases', 'un sismo volcánico'], answer: 0, why: 'Se forma al derretirse el glaciar de la cumbre.' },
      { q: 'Chile tiene muchos volcanes porque…', options: ['la placa de Nazca subduce bajo la Sudamericana', 'tiene muchos desiertos', 'está cerca del Polo Sur', 'su clima es templado'], answer: 0, why: 'La subducción genera magma bajo los Andes.' },
      { q: 'La institución que vigila los volcanes en Chile es…', options: ['el SERNAGEOMIN', 'la DGAC', 'el SII', 'la CONAF'], answer: 0, why: 'Emite la alerta técnica volcánica.' },
      { q: 'Un beneficio de los volcanes es…', options: ['la energía geotérmica', 'la caída de ceniza', 'los lahares', 'los gases tóxicos'], answer: 0, why: 'Ejemplo: Cerro Pabellón, en Antofagasta.' },
      { q: 'La ceniza volcánica es peligrosa porque…', options: ['daña pulmones, motores, cultivos y techos', 'es radiactiva', 'está siempre a 1000 °C', 'no tiene peligro'], answer: 0, why: 'Partículas finas y abrasivas de roca y vidrio.' }
    ],
    help: { intro: 'En «Lab» cambia la sílice y los gases del magma para pasar de erupciones efusivas a explosivas; agrega un glaciar para ver un lahar o sube la alerta técnica.', items: [['Puntos', 'naranjo: lava; gris: ceniza; café: lahar.'], ['Capa Interior', 'muestra la cámara magmática y la chimenea.'], ['Gráfico', 'mapa del tipo de erupción según sílice y gases.']], try: ['Sube la sílice de 48 a 70 %: ¿qué cambia en la erupción?', 'Con poca sílice, sube mucho los gases: ¿se vuelve explosiva?', 'Activa el glaciar: ¿hacia dónde baja el lahar?'] }
  };
  MSim.create(def);
})();
