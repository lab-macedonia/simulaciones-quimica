/* Química descriptiva de los grupos — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var G = {
    g1: { n: 'Alcalinos (grupo 1)', el: [['Li', 152, 520, -3.04, 0x9775fa, 'lenta, burbujeo suave'], ['Na', 186, 496, -2.71, 0xff922b, 'rápida, la pastilla se funde'], ['K', 227, 419, -2.93, 0xcc5de8, 'violenta, llama lila'], ['Rb', 248, 403, -2.98, 0xf06595, 'muy violenta, explosiva'], ['Cs', 265, 376, -3.03, 0xfcc419, 'explosiva']], rx: 'M + H₂O → MOH + ½H₂', col: 0 },
    g2: { n: 'Alcalinotérreos (grupo 2)', el: [['Be', 112, 900, -1.85, 0x69db7c, 'no reacciona'], ['Mg', 160, 738, -2.37, 0xced4da, 'muy lenta (reacciona con vapor)'], ['Ca', 197, 590, -2.87, 0xff6b6b, 'moderada, burbujeo'], ['Sr', 215, 549, -2.89, 0xfa5252, 'rápida'], ['Ba', 222, 503, -2.91, 0x8ce99a, 'rápida']], rx: 'M + 2H₂O → M(OH)₂ + H₂', col: 0 },
    g17: { n: 'Halógenos (grupo 17)', el: [['F', 64, 1681, 2.87, 0xd0ebff, 'gas amarillo pálido, oxidante fortísimo'], ['Cl', 99, 1251, 1.36, 0x8ce99a, 'gas verde amarillento'], ['Br', 114, 1140, 1.07, 0xc2255c, 'líquido rojo pardo'], ['I', 133, 1008, 0.54, 0x7048e8, 'sólido violeta oscuro, sublima']], rx: 'X₂ + 2e⁻ → 2X⁻', col: 1 },
    g18: { n: 'Gases nobles (grupo 18)', el: [['He', 31, 2372, 0, 0xffe066, 'monoatómico, p.e. 4 K'], ['Ne', 38, 2081, 0, 0xff6b6b, 'luz roja en tubos'], ['Ar', 71, 1521, 0, 0x74c0fc, '≈ 1 % del aire'], ['Kr', 88, 1351, 0, 0xa5d8ff, 'forma KrF₂'], ['Xe', 108, 1170, 0, 0x9775fa, 'forma XeF₂, XeF₄, XeO₃']], rx: 'inertes (capa completa)', col: 0 }
  };
  var OX = [['Na₂O', 'básico', 14, 'Na₂O + H₂O → 2NaOH'], ['MgO', 'básico', 10.5, 'MgO + H₂O → Mg(OH)₂ (poco soluble)'], ['Al₂O₃', 'anfótero', 7, 'reacciona con ácidos y con bases'], ['SiO₂', 'ácido débil', 6, 'insoluble en agua; con bases forma silicatos'], ['P₄O₁₀', 'ácido', 2, 'P₄O₁₀ + 6H₂O → 4H₃PO₄'], ['SO₃', 'ácido', 0.5, 'SO₃ + H₂O → H₂SO₄'], ['Cl₂O₇', 'ácido fuerte', 0, 'Cl₂O₇ + H₂O → 2HClO₄']];
  var S = { g: 'g1', i: 0, p: 0, mode: 'grp', ox: 0 }, grpO = null, lab = [], atoms = [], bubbles = [], water = null, flame = null, hs = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ['Tendencias en la tabla', 'Tendencias', 'Radio, energía de ionización y electronegatividad cambian de forma regular',
        '<p>Al <b>bajar en un grupo</b> aumenta el radio atómico (más capas) y disminuye la <b>energía de ionización</b>; al <b>avanzar en un periodo</b> el radio disminuye y la energía de ionización aumenta (mayor carga nuclear efectiva). Estas dos tendencias explican casi toda la química descriptiva: los metales reactivos están a la izquierda y abajo, los no metales reactivos a la derecha y arriba.</p>'],
      ['Alcalinos', 'Alcalinos', 'Un electrón de valencia: reductores fuertes que reaccionan con agua cada vez más violentamente',
        '<p>Los metales del <b>grupo 1</b> tienen un solo e⁻ s¹ que pierden con facilidad (I₁ baja): son <b>reductores muy fuertes</b>, blandos, de baja densidad. Reaccionan con agua: <b>M + H₂O → MOH + ½H₂</b>, cada vez más violentamente hacia el Cs. Se guardan bajo aceite. Los iones dan colores a la llama (Li rojo, Na amarillo, K lila).</p>'],
      ['Alcalinotérreos', 'Alcalinotérreos', 'Dos e⁻ de valencia: M²⁺; reactividad creciente hacia abajo',
        '<p>El <b>grupo 2</b> forma cationes M²⁺. Son menos reactivos que los alcalinos: Be no reacciona con agua, Mg lo hace con vapor, y Ca, Sr y Ba reaccionan con agua fría. Los hidróxidos son cada vez más <b>básicos y solubles</b> (Mg(OH)₂ poco soluble; Ba(OH)₂ soluble). El Ca y el Mg son esenciales en biología (huesos, clorofila, enzimas).</p>'],
      ['Halógenos', 'Halógenos', 'Siete e⁻ de valencia: oxidantes fuertes; el poder oxidante disminuye hacia abajo',
        '<p>Los <b>halógenos</b> (X₂) son diatómicos; el estado cambia por las <b>fuerzas de London</b> crecientes: F₂ y Cl₂ gases, Br₂ líquido, I₂ sólido. El poder oxidante sigue <b>F₂ &gt; Cl₂ &gt; Br₂ &gt; I₂</b> (E° = 2,87; 1,36; 1,07; 0,54 V): un halógeno desplaza al ion de otro más abajo (Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂).</p>'],
      ['Gases nobles', 'Gases nobles', 'Capa de valencia completa: muy poco reactivos',
        '<p>Con la capa de valencia completa (ns²np⁶) los <b>gases nobles</b> son monoatómicos e inertes. Solo los más pesados (Kr, Xe, Rn), con menor energía de ionización, forman compuestos con elementos muy electronegativos (<b>XeF₂, XeF₄, XeO₃, KrF₂</b>). Sus puntos de ebullición aumentan hacia abajo (He 4 K; Xe 165 K) por la polarizabilidad.</p>'],
      ['Óxidos del periodo 3', 'Óxidos', 'De básicos (Na₂O) a ácidos (SO₃, Cl₂O₇) a lo largo del periodo',
        '<p>El carácter ácido–base de los óxidos cambia a lo largo de un periodo: los óxidos de <b>metales</b> (Na₂O, MgO) son <b>básicos</b> y forman hidróxidos; el <b>Al₂O₃ es anfótero</b>; los de <b>no metales</b> (SiO₂, P₄O₁₀, SO₃, Cl₂O₇) son <b>ácidos</b> y forman oxoácidos. El pH de la disolución acuosa de cada óxido baja de ≈ 14 a ≈ 0.</p>']
    ];
  }
  var def = {
    key: 'quimica-descriptiva-grupos', title: 'Química descriptiva de los grupos', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#faa2c1', light: '#a61e4d' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [2, 6, 22], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 2, 24], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 24, 3], target: [0, 0, 0] }],
    layers: [{ id: 'r', label: 'Radios atómicos', icon: '○' }, { id: 'rx', label: 'Reacción con agua', icon: '💧' }],
    build: function (ctx) {
      grpO = new T.Group(); ctx.scene.add(grpO); var i;
      for (i = 0; i < 7; i++) { var a = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2 })); grpO.add(a); atoms.push(a); var h = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff })); h.visible = false; grpO.add(h); hs.push(h); }
      water = new T.Mesh(new T.BoxGeometry(24, 2.4, 6), new T.MeshStandardMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.45 })); water.position.set(0, -6.2, 0); grpO.add(water);
      for (i = 0; i < 30; i++) { var b = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); grpO.add(b); bubbles.push(b); }
      flame = new T.Mesh(new T.ConeGeometry(0.8, 2, 10), new T.MeshBasicMaterial({ color: 0xffa94d, transparent: true, opacity: 0.7 })); flame.visible = false; grpO.add(flame);
      for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = i === 5 ? 'ox' : 'grp'; S.g = ['g1', 'g1', 'g2', 'g17', 'g18', 'g1'][i]; S.p = (f.local * 1.3) % 1; if (i === 5) S.ox = Math.min(6, Math.floor(f.local * 7)); else S.i = Math.min(G[S.g].el.length - 1, Math.floor(f.local * G[S.g].el.length)); if (i === 0) S.g = ['g1', 'g17'][f.local < 0.5 ? 0 : 1]; }
      S.i = Math.max(0, Math.min(S.i | 0, G[S.g].el.length - 1)); S.ox = Math.max(0, Math.min(S.ox | 0, OX.length - 1));
      lab.forEach(function (l) { l.vis(false); }); atoms.forEach(function (a) { a.visible = false; }); hs.forEach(function (h) { h.visible = false; }); bubbles.forEach(function (b) { b.visible = false; }); flame.visible = false; water.visible = false;
      var rOn = ctx.layer('r'), xOn = ctx.layer('rx');
      if (S.mode === 'ox') {
        var o = OX[S.ox]; OX.forEach(function (d, j) { var h = hs[j]; h.visible = true; var hh = 1 + (14 - d[2]) * 0.35 * 0 + 0.4 + 0.4 * (14 - d[2]) / 2; h.scale.set(1.6, 0.4 + (14 - d[2]) * 0.5, 1.6); h.position.set(-9 + j * 3, -4 + h.scale.y / 2, 0); var t = d[2] / 14; h.material.color.setRGB(1 - 0.8 * t + 0.2, 0.3 + 0.3 * (1 - Math.abs(t - 0.5) * 2), 0.2 + 0.8 * t); lab[j % 8].pos(-9 + j * 3, -5.6, 0).set(d[0], j === S.ox ? 'bl-lead' : 'bl-d').vis(true); }); lab[7].pos(0, 7, 0).set(o[0] + ' · óxido ' + o[1] + ' · pH ≈ ' + fmt(o[2], 1), 'bl-lead').vis(true);
        return;
      }
      var G0 = G[S.g], n = G0.el.length, x0 = -(n - 1) * 3.2 / 2; water.visible = xOn && S.g !== 'g18' && S.g !== 'g17';
      G0.el.forEach(function (e, j) { var a = atoms[j]; a.visible = true; var r = rOn ? e[1] / 90 : 1; a.scale.setScalar(Math.max(0.5, r)); a.position.set(x0 + j * 3.2 * (1.0), 1.5 + Math.sin(now * 0.6 + j) * 0.1, 0); a.material.color.setHex(e[4]); lab[j].pos(a.position.x, a.position.y + a.scale.x + 0.8, 0).set(e[0], j === S.i ? 'bl-lead' : 'bl-d').vis(true); });
      var cur = G0.el[S.i], a2 = atoms[S.i]; var rate = S.g === 'g1' ? [0.25, 0.5, 0.75, 0.95, 1][S.i] : (S.g === 'g2' ? [0, 0.05, 0.4, 0.7, 0.8][S.i] : 0);
      if (water.visible && xOn) { a2.position.y = -4.4 + 1 * Math.sin(now * (3 + 6 * rate)) * 0.1 + 6 * (1 - sm(S.p)) * 0; a2.position.x = 0; bubbles.forEach(function (b, k) { var u = (now * (0.3 + rate * 1.5) + k / bubbles.length) % 1; b.visible = rate > 0.05 && k < 4 + rate * 26; b.position.set(a2.position.x + Math.sin(k * 3 + now) * 1.2, -4.8 + u * 6, Math.cos(k * 2) * 1.0); }); if (S.g === 'g1' && S.i >= 2) { flame.visible = true; flame.position.set(a2.position.x, a2.position.y + 1.4, 0); flame.scale.set(1 + rate, 1 + rate * 1.3, 1); flame.material.color.setHex(S.i === 2 ? 0xcc5de8 : (S.i === 3 ? 0xf06595 : 0xfcc419)); } lab[5].pos(0, -9, 0).set('M + H₂O: ' + cur[5], rate > 0.7 ? 'bl-neg' : 'bl-d').vis(true); lab[6].pos(0, 6, 0).set(G0.n + ' · ' + cur[0], 'bl-lead').vis(true); }
      else { lab[6].pos(0, 6, 0).set(G0.n + ' · ' + cur[0] + ': ' + cur[5], 'bl-lead').vis(true); lab[5].pos(0, -3.8, 0).set(G0.rx, 'bl-d').vis(true); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.g) u.g.set(S.g); if (u.i) u.i.set(S.i); if (u.ox) u.ox.set(S.ox); },
    hud: function () { if (S.mode === 'ox') { var o = OX[S.ox]; return { eq: { chip: String(fmt(o[2], 0)), name: o[0], body: '<div class="eqline"><small>Carácter</small>' + o[1] + '</div><div class="eqline"><small>pH aprox.</small>' + fmt(o[2], 1) + '</div><div class="eqline"><small>Reacción</small>' + o[3] + '</div>' }, legend: [{ label: 'Azul', color: '#4263eb', text: 'óxido ácido' }, { label: 'Rojo', color: '#e03131', text: 'óxido básico' }] }; } var G0 = G[S.g], e = G0.el[S.i]; return { eq: { chip: e[0], name: e[0] + ' · ' + G0.n, body: '<div class="eqline"><small>Radio atómico</small>' + e[1] + ' pm</div><div class="eqline"><small>Energía de ionización</small>' + e[2] + ' kJ/mol</div><div class="eqline"><small>E° (M⁺/M o X₂/X⁻)</small>' + fmt(e[3], 2) + ' V</div><div class="eqline"><small>Comportamiento</small>' + e[5] + '</div>' }, legend: [{ label: 'Tamaño', color: '#adb5bd', text: 'radio atómico relativo' }] }; },
    measures: function () { if (S.mode === 'ox') { var o = OX[S.ox]; return [['Óxido', o[0]], ['Carácter', o[1]], ['pH aproximado', fmt(o[2], 1)], ['Reacción', o[3]]]; } var G0 = G[S.g], e = G0.el[S.i]; return [['Grupo', G0.n], ['Elemento', e[0]], ['Radio atómico', e[1] + ' pm'], ['Primera energía de ionización', e[2] + ' kJ/mol'], ['E°', fmt(e[3], 2) + ' V']]; },
    ideas: ['Al bajar en un grupo: radio ↑, I₁ ↓.', 'Alcalinos: reactividad con agua crece hacia abajo.', 'Halógenos: poder oxidante F₂ > Cl₂ > Br₂ > I₂.', 'Óxidos: básicos → anfóteros → ácidos.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Grupo'); el.appendChild(c);
      ui.g = kit.ui.options({ label: 'Grupo', cols: 2, value: S.g, options: Object.keys(G).map(function (k) { return { v: k, label: G[k].n }; }), onChange: function (v) { ctx.goManual(); S.mode = 'grp'; S.g = v; S.i = 0; } }); c.appendChild(ui.g);
      ui.i = kit.ui.slider({ label: 'Elemento (de arriba hacia abajo)', min: 0, max: 4, step: 1, value: S.i, format: function (v) { var e = G[S.g].el[v]; return e ? e[0] : '—'; }, onInput: function (v) { ctx.goManual(); S.mode = 'grp'; S.i = Math.min(v, G[S.g].el.length - 1); } });
      c.appendChild(kit.ui.sliders([ui.i]));
      var d = kit.ui.card('Óxidos del periodo 3'); el.appendChild(d); ui.ox = kit.ui.options({ label: 'Óxido', cols: 4, value: S.ox, options: OX.map(function (o, j) { return { v: j, label: o[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'ox'; S.ox = +v; } }); d.appendChild(ui.ox);
      d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Primera energía de ionización (kJ/mol)', h: 230, note: 'Cae al bajar en el grupo. Círculo: elemento actual.', draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, mx = 2500, keys = Object.keys(G); cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (var k = 0; k <= 2500; k += 500) cx.fillText(k, L - 4, Tp + ph * (1 - k / mx) + 3);
        var cols = { g1: '#9775fa', g2: '#69db7c', g17: '#f06595', g18: '#74c0fc' };
        keys.forEach(function (key) { cx.strokeStyle = cols[key]; cx.lineWidth = key === S.g ? 3 : 1.5; cx.beginPath(); G[key].el.forEach(function (e, j) { var x = L + pw * j / 4, y = Tp + ph * (1 - e[2] / mx); (j ? cx.lineTo : cx.moveTo).call(cx, x, y); }); cx.stroke(); cx.fillStyle = cols[key]; cx.textAlign = 'left'; cx.fillText(G[key].n.split(' ')[0], L + pw + 2 - 60, Tp + ph * (1 - G[key].el[0][2] / mx) - 4); }); cx.lineWidth = 1;
        if (S.mode !== 'ox') { var e = G[S.g].el[S.i]; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * S.i / 4, Tp + ph * (1 - e[2] / mx), 5, 0, 6.28); cx.fill(); }
        cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('periodo (2 → 6) →', L + pw / 2, h - 6);
      } },
      { title: 'pH de las disoluciones de óxidos (periodo 3)', h: 210, note: 'Del carácter básico (Na₂O) al ácido (Cl₂O₇).', draw: function (cx, w, h, col) {
        var L = 30, Rr = 10, Tp = 10, B = 26, pw = w - L - Rr, ph = h - Tp - B, bw = pw / OX.length; cx.font = '10px system-ui'; OX.forEach(function (o, j) { var t = o[2] / 14; cx.fillStyle = 'rgb(' + Math.round(230 - 190 * t) + ',' + Math.round(90 + 60 * (1 - Math.abs(t - 0.5) * 2)) + ',' + Math.round(60 + 190 * t) + ')'; cx.globalAlpha = (S.mode === 'ox' && j === S.ox) ? 1 : 0.7; cx.fillRect(L + j * bw + 4, Tp + ph * (1 - t), bw - 8, ph * t + 0.5); cx.globalAlpha = 1; cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(fmt(o[2], 1), L + j * bw + bw / 2, Tp + ph * (1 - t) - 3); cx.fillStyle = col.muted; cx.fillText(o[0], L + j * bw + bw / 2, h - 10); });
      } }
    ],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'ox') { var o = OX[S.ox]; return '<div class="card-kicker">' + o[0] + '</div><table class="calc-table">' + row('Carácter', o[1]) + row('Reacción', o[3]) + row('pH aprox.', fmt(o[2], 1)) + '</table>'; } var G0 = G[S.g], e = G0.el[S.i], ex = G0.el.map(function (x) { return x[0] + ' ' + x[1] + ' pm'; }).join(' · '); var dE = S.i > 0 ? e[2] - G0.el[S.i - 1][2] : 0; return '<div class="card-kicker">' + G0.n + '</div><table class="calc-table">' + row('Elemento', e[0]) + row('Radio', e[1] + ' pm') + row('I₁', e[2] + ' kJ/mol') + (S.i > 0 ? row('ΔI₁ respecto al anterior', (dE > 0 ? '+' : '') + dE + ' kJ/mol') : '') + row('E°', fmt(e[3], 2) + ' V') + row('Reacción', G0.rx) + '</table>'; },
    quiz: [
      { q: 'Al bajar en el grupo 1, la reactividad frente al agua…', options: ['aumenta', 'disminuye', 'no cambia', 'se anula'], answer: 0, why: 'Menor energía de ionización.' },
      { q: 'El halógeno más oxidante es…', options: ['F₂', 'Cl₂', 'Br₂', 'I₂'], answer: 0, why: 'E° = 2,87 V.' },
      { q: 'El Al₂O₃ es…', options: ['anfótero', 'ácido', 'básico', 'neutro'], answer: 0, why: 'Reacciona con ácidos y bases.' },
      { q: 'El I₂ a temperatura ambiente es…', options: ['sólido', 'gas', 'líquido', 'plasma'], answer: 0, why: 'Fuerzas de London mayores.' },
      { q: 'Un gas noble que forma compuestos es…', options: ['xenón', 'helio', 'neón', 'argón'], answer: 0, why: 'XeF₂, XeF₄, XeO₃.' },
      { q: 'SO₃ + H₂O produce…', options: ['H₂SO₄', 'H₂S', 'SO₂', 'S'], answer: 0, why: 'Óxido ácido.' }
    ],
    help: { intro: 'Elige un grupo y recorre los elementos con el control; los tamaños son los radios atómicos. Los alcalinos y alcalinotérreos se ven reaccionando con agua; en «Óxidos» comparas el periodo 3.', items: [['Esferas', 'su tamaño es el radio atómico relativo; crecen al bajar en el grupo.'], ['Reacción con agua', 'los alcalinos y alcalinotérreos reaccionan en el agua; las burbujas son H₂ desprendido.'], ['Controles', '«Grupo», «Elemento (de arriba hacia abajo)» y «Óxido», para comparar los óxidos del periodo 3.'], ['Gráficos', '«Primera energía de ionización (kJ/mol)» y «pH de las disoluciones de óxidos (periodo 3)».']], try: ['Recorre los alcalinos de arriba hacia abajo: el radio sube, I₁ baja y la reacción con agua es más violenta.', 'En los halógenos compara el poder oxidante: F₂ > Cl₂ > Br₂ > I₂.', 'Recorre los óxidos del periodo 3: básicos → anfótero (Al₂O₃) → ácidos.'] }
  };
  MSim.create(def);
})();
