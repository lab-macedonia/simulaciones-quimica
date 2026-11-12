/* Rocas, estratos y fósiles — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE;
  var LY = [
    { n: 'Arenisca con trilobites', r: 'arenisca', c: 0xd9a066, f: 'trilobite', age: 510, per: 'Cámbrico' },
    { n: 'Lutita con peces acorazados', r: 'lutita', c: 0x8d8579, f: 'pez', age: 400, per: 'Devónico' },
    { n: 'Carbón con helechos', r: 'carbón', c: 0x3b3b3b, f: 'helecho', age: 310, per: 'Carbonífero' },
    { n: 'Caliza con amonites', r: 'caliza', c: 0xe9e3c9, f: 'amonite', age: 150, per: 'Jurásico' },
    { n: 'Arcilla del límite K-Pg', r: 'arcilla', c: 0xb07a52, f: null, age: 66, per: 'Cretácico–Paleógeno' },
    { n: 'Conglomerado con mamíferos', r: 'conglomerado', c: 0xc2a878, f: 'diente', age: 10, per: 'Neógeno' }
  ];
  var ROCK = { ig: { n: 'Ígnea (granito)', c: 0xd6c9c9, how: 'se enfría el magma' }, se: { n: 'Sedimentaria (arenisca)', c: 0xd9a066, how: 'sedimentos compactados y cementados' }, me: { n: 'Metamórfica (gneis)', c: 0x7d7d8a, how: 'calor y presión sin fundirse' } };
  var S = { mode: 'estratos', dep: 6, intr: false, up: 0, ero: 0, sel: 3, fos: 1, cyc: 0 };
  var G = {}, lab = {}, layers = [], fossils = [], W = 10, TH = 0.8;
  function stages() {
    return [
      ['Tres tipos de rocas', 'Tipos', 'Ígneas, sedimentarias y metamórficas se distinguen por su origen',
        '<p>Las rocas se clasifican por su <b>origen</b>. Las <b>ígneas</b> se forman al enfriarse el magma: lento en profundidad (granito, con cristales grandes) o rápido en la superficie (basalto). Las <b>sedimentarias</b> se forman al compactarse y cementarse sedimentos (arenisca, caliza) y pueden contener fósiles. Las <b>metamórficas</b> son rocas transformadas por <b>calor y presión</b> sin llegar a fundirse (mármol, gneis).</p>'],
      ['El ciclo de las rocas', 'Ciclo', 'Toda roca puede transformarse en otra con el tiempo',
        '<p>Las rocas cambian de un tipo a otro en el <b>ciclo de las rocas</b>: la <b>meteorización y la erosión</b> rompen cualquier roca en sedimentos; estos se <b>compactan</b> en rocas sedimentarias; el <b>calor y la presión</b> las vuelven metamórficas; si se <b>funden</b> forman magma, que al <b>enfriarse</b> da rocas ígneas. Lo impulsan el calor interno de la Tierra (tectónica) y la energía del Sol (agua, viento, hielo).</p>'],
      ['Sedimentación y estratos', 'Estratos', 'Los sedimentos se depositan en capas horizontales',
        '<p>Ríos, viento y mar transportan sedimentos que se depositan en <b>capas horizontales</b> en el fondo de lagos y mares. Con el peso de las capas superiores se compactan y cementan: se forman <b>estratos</b>. Cada estrato registra el ambiente de su época: arena de playas, barro de aguas tranquilas, restos de plantas en pantanos o caparazones en mares cálidos.</p>'],
      ['Fosilización', 'Fósiles', 'Restos o huellas de seres vivos conservados en las rocas',
        '<p>Un <b>fósil</b> se forma cuando un organismo muere y queda <b>sepultado rápidamente</b> por sedimentos, lejos del oxígeno y de los descomponedores. Con el tiempo, las partes duras (huesos, conchas, dientes) son <b>reemplazadas por minerales</b> o dejan su molde. También son fósiles las huellas, madrigueras y excrementos. La mayoría de los seres vivos <b>no</b> se fosiliza: el registro fósil es incompleto.</p>'],
      ['Datación relativa', 'Datación', 'Superposición: abajo lo más antiguo; lo que corta una capa es más joven',
        '<p>Por el <b>principio de superposición</b>, en estratos no alterados los de abajo son <b>más antiguos</b> que los de arriba. Una <b>intrusión</b> de magma (dique) es <b>más joven</b> que las capas que atraviesa. Los <b>fósiles guía</b> (como trilobites o amonites), que vivieron poco tiempo y en muchos lugares, permiten correlacionar capas de distintos sitios y asignarles una edad.</p>'],
      ['Levantamiento y erosión', 'Erosión', 'Las fuerzas internas levantan los estratos y la erosión los deja a la vista',
        '<p>Los movimientos tectónicos <b>levantan</b> y a veces <b>pliegan o inclinan</b> los estratos, que se formaron en el fondo del mar; por eso se encuentran fósiles marinos en montañas, incluso en los Andes. Luego la <b>erosión</b> de ríos y glaciares excava valles y cañones que dejan a la vista la secuencia de capas, como un libro de la historia de la Tierra.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.intr = false; S.up = 0; S.ero = 0; S.fos = 1;
    if (i === 0) { S.mode = 'ciclo'; S.cyc = -1; }
    else if (i === 1) { S.mode = 'ciclo'; S.cyc = l * 5; }
    else if (i === 2) { S.mode = 'estratos'; S.dep = 0.5 + 5.5 * l; S.fos = 0; }
    else if (i === 3) { S.mode = 'estratos'; S.dep = 6; S.fos = l; S.sel = 3; }
    else if (i === 4) { S.mode = 'estratos'; S.dep = 6; S.intr = l > 0.4; S.sel = Math.min(5, Math.floor(l * 6)); }
    else { S.mode = 'estratos'; S.dep = 6; S.up = clamp(l * 2, 0, 1); S.ero = clamp(l * 2 - 0.6, 0, 1); S.intr = true; }
  }
  function box(w, h, d, c, o) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.95 }, o || {}))); }
  function fossilMesh(kind) {
    var m = new T.MeshStandardMaterial({ color: 0xf1e3c6, roughness: 0.5 }), g;
    if (kind === 'amonite') { g = new T.Mesh(new T.TorusGeometry(0.22, 0.08, 10, 24, Math.PI * 1.8), m); }
    else if (kind === 'trilobite') { g = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), m); g.scale.set(1, 0.3, 1.5); }
    else if (kind === 'pez') { g = new T.Mesh(new T.ConeGeometry(0.12, 0.6, 8), m); g.rotation.z = Math.PI / 2; }
    else if (kind === 'helecho') { g = new T.Mesh(new T.BoxGeometry(0.5, 0.03, 0.18), new T.MeshStandardMaterial({ color: 0x8ce99a })); }
    else { g = new T.Mesh(new T.ConeGeometry(0.08, 0.3, 6), m); }
    return g;
  }
  var def = {
    key: 'rocas-fosiles', title: 'Rocas, estratos y fósiles', subtitle: 'Simulador 3D · ciencias de la Tierra', accent: { dark: '#e9c46a', light: '#8a5a00' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-2.5, 6, 15], target: [-2, 2.2, 0] }, { id: 'frente', label: 'De frente', pos: [-2, 2.6, 16], target: [-2, 2.4, 0] }],
    layers: [{ id: 'fos', label: 'Fósiles', icon: '◎' }, { id: 'age', label: 'Edades', icon: '⏱' }],
    build: function (ctx) {
      var s = ctx.scene; G.st = new T.Group(); s.add(G.st);
      LY.forEach(function (ly, i) { var L = box(W, TH, 3.4, ly.c); L.position.set(0, TH / 2 + i * TH, 0); G.st.add(L); layers.push(L); var f = fossilMesh(ly.f); f.position.set(-3 + (i % 3) * 2.2, TH / 2 + i * TH, 1.75); f.visible = !!ly.f; G.st.add(f); fossils.push(f); });
      G.dike = box(0.6, TH * 6 + 0.6, 3.5, 0xc92a2a, { emissive: 0x3d0000 }); G.dike.position.set(2.6, TH * 3 - 0.3, 0); G.st.add(G.dike);
      G.water = box(W + 0.2, 1.4, 3.5, 0x4dabf7, { transparent: true, opacity: 0.3 }); s.add(G.water);
      G.cut = box(2.4, 1, 3.6, 0xdbe6f1, { transparent: true, opacity: 1 }); G.st.add(G.cut);
      G.org = fossilMesh('amonite'); G.org.material = new T.MeshStandardMaterial({ color: 0xff922b }); s.add(G.org);
      // ciclo de rocas
      G.cyc = new T.Group(); s.add(G.cyc); G.rk = {};
      [['ig', -1.6, 0], ['se', 3.6, 2.2], ['me', 3.6, -2.2]].forEach(function (q) { var r = new T.Mesh(new T.DodecahedronGeometry(0.9, 0), new T.MeshStandardMaterial({ color: ROCK[q[0]].c, roughness: 0.9, flatShading: true })); r.position.set(q[1] - 1, 1.2, q[2]); G.cyc.add(r); G.rk[q[0]] = r; });
      G.magma = new T.Mesh(new T.SphereGeometry(0.8, 20, 14), new T.MeshStandardMaterial({ color: 0xff6b2b, emissive: 0x8a2a00 })); G.magma.position.set(0.8, -0.6, 0); G.cyc.add(G.magma);
      G.dot = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), new T.MeshBasicMaterial({ color: 0xffd43b })); G.cyc.add(G.dot);
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      var est = S.mode === 'estratos'; G.st.visible = est; G.water.visible = est && S.up < 0.2; G.cyc.visible = !est; G.org.visible = false;
      if (est) {
        var showF = ctx.layer('fos'), showA = ctx.layer('age');
        layers.forEach(function (L, i) { var k = clamp(S.dep - i, 0, 1); L.visible = k > 0; L.scale.y = Math.max(0.01, k); L.position.y = i * TH + TH * k / 2; fossils[i].visible = !!LY[i].f && k >= 1 && showF && (i !== 3 || S.fos > 0.85 || ctx.P.manual || f.i !== 3); });
        var top = Math.min(S.dep, 6) * TH; G.water.position.set(0, top + 0.7, 0); G.water.scale.y = 1;
        G.dike.visible = S.intr; G.st.rotation.z = -0.18 * S.up; G.st.position.y = 1.5 * S.up;
        G.cut.visible = S.ero > 0; G.cut.scale.set(1, Math.max(0.01, S.ero * TH * 4), 1); G.cut.position.set(-1.2, top - S.ero * TH * 2 + 0.02, 0); G.cut.material.color.setHex(ctx.theme === 'dark' ? 0x0e131a : 0xdbe6f1);
        if (f.i === 3 && !ctx.P.manual) { var y0 = 3 * TH + TH, fall = clamp(S.fos * 2.5, 0, 1); G.org.visible = S.fos < 0.85; G.org.position.set(-3 + 2.2 * 0, y0 + 2.5 * (1 - fall), 1.75); lab.g.pos(-3, y0 + 3.2, 1.75).set(S.fos < 0.35 ? 'Muere un amonite y cae al fondo' : S.fos < 0.6 ? 'Lo cubren los sedimentos' : S.fos < 0.85 ? 'Los minerales reemplazan la concha' : 'Fósil', 'bl-lead').vis(true); }
        if (showA) LY.forEach(function (ly, i) { if (S.dep - i >= 1) lab[['a', 'b', 'c', 'd', 'e', 'f'][i]].pos(W / 2 + 1.6, i * TH + TH / 2 + 1.5 * S.up - 0.9 * S.up * (i / 6), 0).set(ly.per + ' · ' + fmt(ly.age, 0) + ' Ma', i === S.sel ? 'bl-warn' : 'bl-d').vis(true); });
        if (S.intr) lab.g.pos(2.6, 6 * TH + 1 + 1.5 * S.up, 0).set('Dique: más joven que las capas que corta', 'bl-pos').vis(true);
        layers.forEach(function (L, i) { L.material.emissive && L.material.emissive.setHex(i === S.sel ? 0x332200 : 0x000000); });
      } else {
        var steps = [['se', 'me', 'Calor y presión'], ['me', 'magma', 'Fusión'], ['magma', 'ig', 'Enfriamiento'], ['ig', 'se', 'Meteorización, erosión y compactación'], ['se', 'se', 'Sedimentos → roca sedimentaria']], k2 = Math.floor(S.cyc), u = S.cyc - k2;
        G.dot.visible = S.cyc >= 0; if (S.cyc >= 0) { var st2 = steps[Math.min(4, k2)], a = st2[0] === 'magma' ? G.magma.position : G.rk[st2[0]].position, b = st2[1] === 'magma' ? G.magma.position : G.rk[st2[1]].position; G.dot.position.copy(a).lerp(b, u); G.dot.position.y += 0.6 + Math.sin(u * Math.PI) * 1.2; lab.g.pos(0.8, 4.2, 0).set(st2[2], 'bl-lead').vis(true); }
        Object.keys(G.rk).forEach(function (key, j) { G.rk[key].rotation.y += dt * 0.3; lab[['a', 'b', 'c'][j]].pos(G.rk[key].position.x, 2.6, G.rk[key].position.z).set(ROCK[key].n, 'bl-pos').vis(true); });
        lab.d.pos(0.8, -1.8, 0).set('Magma', 'bl-warn').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.dep && u.dep.set(S.dep); u.up && u.up.set(S.up); } },
    hud: function () { var ly = LY[S.sel]; return { eq: { chip: '⛰', name: S.mode === 'estratos' ? 'Estrato ' + (S.sel + 1) + ': ' + ly.n : 'Ciclo de las rocas', body: S.mode === 'estratos' ? '<div class="eqline"><small>Período</small>' + ly.per + '</div><div class="eqline"><small>Edad aprox.</small>' + fmt(ly.age, 0) + ' millones de años</div><div class="eqline"><small>Roca</small>' + ly.r + '</div>' : '<div class="eqline"><small>Ígneas</small>' + ROCK.ig.how + '</div><div class="eqline"><small>Sedimentarias</small>' + ROCK.se.how + '</div><div class="eqline"><small>Metamórficas</small>' + ROCK.me.how + '</div>' }, legend: [{ label: 'Abajo', color: '#d9a066', text: 'estratos más antiguos' }, { label: 'Rojo', color: '#c92a2a', text: 'intrusión ígnea (dique)' }, { label: 'Crema', color: '#f1e3c6', text: 'fósiles' }] }; },
    measures: function () { var ly = LY[S.sel]; return [['Estratos depositados', fmt(Math.min(6, S.dep), 1)], ['Estrato seleccionado', (S.sel + 1) + ' · ' + ly.n], ['Edad', fmt(ly.age, 0) + ' Ma (' + ly.per + ')'], ['Fósil guía', ly.f ? ly.f : '—'], ['Intrusión', S.intr ? 'sí (más joven que las capas)' : 'no'], ['Levantamiento', fmt(S.up * 100, 0) + ' %']]; },
    ideas: ['Ígneas: magma enfriado; sedimentarias: sedimentos compactados; metamórficas: calor y presión.', 'Ciclo de las rocas: toda roca puede volverse otra.', 'Estratos: capas horizontales de sedimentos.', 'Fósil: resto o huella conservado en roca sedimentaria.', 'Superposición: abajo lo más antiguo.', 'Fósiles guía: datan y correlacionan capas.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Escena'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Ver', cols: 2, value: S.mode, options: [{ v: 'estratos', label: 'Estratos y fósiles' }, { v: 'ciclo', label: 'Ciclo de las rocas' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.dep = kit.ui.slider({ label: 'Estratos depositados', min: 0, max: 6, step: 0.1, value: S.dep, digits: 1, onInput: function (v) { ctx.goManual(); S.mode = 'estratos'; S.dep = v; } });
      ui.up = kit.ui.slider({ label: 'Levantamiento y erosión', min: 0, max: 1, step: 0.05, value: S.up, digits: 2, onInput: function (v) { ctx.goManual(); S.mode = 'estratos'; S.up = v; S.ero = clamp(v * 1.2 - 0.2, 0, 1); } });
      ui.sel = kit.ui.slider({ label: 'Estrato a examinar (1 = el más bajo)', min: 1, max: 6, step: 1, value: S.sel + 1, digits: 0, onInput: function (v) { ctx.goManual(); S.sel = clamp(Math.round(v), 1, 6) - 1; } });
      c.appendChild(kit.ui.sliders([ui.dep, ui.up, ui.sel]));
      el.appendChild(ctx.btnRow([{ t: 'Intrusión sí / no', fn: function () { ctx.goManual(); S.intr = !S.intr; } }, { t: 'Recorrer el ciclo', primary: true, fn: function () { ctx.goManual(); S.mode = 'ciclo'; S.cyc = 0; var id = setInterval(function () { S.cyc += 0.05; if (S.cyc >= 5) { S.cyc = 4.99; clearInterval(id); } }, 60); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Columna estratigráfica', h: 240, note: 'Cada estrato con su edad aproximada y su fósil guía. Más abajo, más antiguo (principio de superposición).', draw: function (cx, w, h, col) {
        var L = 20, Bm = 10, rh = (h - 20) / 6, cw = 90; cx.font = '11px system-ui'; cx.textAlign = 'left';
        LY.forEach(function (ly, i) { var y = h - Bm - (i + 1) * rh; cx.fillStyle = '#' + ('00000' + ly.c.toString(16)).slice(-6); cx.fillRect(L, y, cw, rh - 2); if (i === S.sel) { cx.strokeStyle = '#e8590c'; cx.lineWidth = 3; cx.strokeRect(L, y, cw, rh - 2); cx.lineWidth = 1; } cx.fillStyle = col.ink; cx.fillText(ly.per + ' · ' + fmt(ly.age, 0) + ' Ma', L + cw + 10, y + rh / 2 - 2); cx.fillStyle = col.muted; cx.fillText(ly.n, L + cw + 10, y + rh / 2 + 12); });
      } },
      { title: 'Ciclo de las rocas', h: 220, note: 'Procesos que transforman un tipo de roca en otro.', draw: function (cx, w, h, col) {
        var P2 = { ig: [w * 0.2, h * 0.55], se: [w * 0.75, h * 0.25], me: [w * 0.75, h * 0.8], mg: [w * 0.45, h * 0.9] }, nm = { ig: 'Ígnea', se: 'Sedimentaria', me: 'Metamórfica', mg: 'Magma' };
        function arr(a, b, t) { var A = P2[a], B = P2[b]; cx.strokeStyle = col.muted; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(A[0], A[1]); cx.lineTo(B[0], B[1]); cx.stroke(); var ang = Math.atan2(B[1] - A[1], B[0] - A[0]), mx = A[0] + (B[0] - A[0]) * 0.62, my = A[1] + (B[1] - A[1]) * 0.62; cx.fillStyle = col.muted; cx.beginPath(); cx.moveTo(mx + 8 * Math.cos(ang), my + 8 * Math.sin(ang)); cx.lineTo(mx - 6 * Math.cos(ang) + 5 * Math.sin(ang), my - 6 * Math.sin(ang) - 5 * Math.cos(ang)); cx.lineTo(mx - 6 * Math.cos(ang) - 5 * Math.sin(ang), my - 6 * Math.sin(ang) + 5 * Math.cos(ang)); cx.fill(); cx.fillStyle = col.ink; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(t, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 6); }
        arr('ig', 'se', 'erosión y compactación'); arr('se', 'me', 'calor y presión'); arr('me', 'mg', 'fusión'); arr('mg', 'ig', 'enfriamiento');
        cx.font = 'bold 12px system-ui'; Object.keys(P2).forEach(function (k) { cx.fillStyle = k === 'mg' ? '#ff6b2b' : '#e9c46a'; cx.beginPath(); cx.arc(P2[k][0], P2[k][1], 6, 0, 7); cx.fill(); cx.fillStyle = col.ink; cx.textAlign = 'center'; cx.fillText(nm[k], P2[k][0], P2[k][1] + 20); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, ly = LY[S.sel], below = S.sel > 0 ? LY[S.sel - 1] : null, above = S.sel < 5 ? LY[S.sel + 1] : null;
      return '<div class="card-kicker">Estrato ' + (S.sel + 1) + '</div><table class="calc-table">' + row('Roca', ly.r) + row('Edad', '≈ <b>' + fmt(ly.age, 0) + ' millones de años</b> (' + ly.per + ')') + row('Más antiguo que', above ? above.n + ' (' + fmt(above.age, 0) + ' Ma)' : '—') + row('Más joven que', below ? below.n + ' (' + fmt(below.age, 0) + ' Ma)' : '—') + row('Tiempo entre este y el de abajo', below ? fmt(below.age - ly.age, 0) + ' millones de años' : '—') + row('Dique (si existe)', 'más joven que ' + fmt(LY[5].age, 0) + ' Ma: corta todas las capas') + '</table>';
    },
    quiz: [
      { q: 'El granito, con cristales grandes, es una roca…', options: ['ígnea, enfriada lentamente en profundidad', 'sedimentaria', 'metamórfica', 'ígnea, enfriada rápidamente'], answer: 0, why: 'El enfriamiento lento permite que crezcan los cristales.' },
      { q: 'Los fósiles se encuentran sobre todo en rocas…', options: ['sedimentarias', 'ígneas', 'metamórficas', 'volcánicas'], answer: 0, why: 'Los organismos quedan sepultados en sedimentos.' },
      { q: 'El mármol se forma a partir de caliza por…', options: ['calor y presión', 'enfriamiento del magma', 'erosión', 'evaporación'], answer: 0, why: 'Es una roca metamórfica.' },
      { q: 'Según el principio de superposición, en estratos no alterados…', options: ['los de abajo son más antiguos', 'los de arriba son más antiguos', 'todos tienen la misma edad', 'los más gruesos son más antiguos'], answer: 0, why: 'Cada capa se deposita sobre la anterior.' },
      { q: 'Un dique de roca ígnea que corta varios estratos es…', options: ['más joven que esos estratos', 'más antiguo que ellos', 'de la misma edad', 'imposible de datar'], answer: 0, why: 'Tuvieron que existir las capas para que el magma las cortara.' },
      { q: 'Un buen fósil guía debe…', options: ['haber vivido poco tiempo y en muchos lugares', 'ser muy grande', 'haber vivido muchos millones de años en un solo lugar', 'ser de un ser vivo actual'], answer: 0, why: 'Así indica una edad precisa y permite correlacionar.' },
      { q: 'Se encuentran fósiles marinos en los Andes porque…', options: ['los estratos marinos fueron levantados por la tectónica', 'el mar cubrió los Andes el año pasado', 'los animales subieron a la montaña', 'los trajo el viento'], answer: 0, why: 'La subducción levantó rocas que se formaron en el fondo del mar.' },
      { q: 'El motor del ciclo de las rocas es…', options: ['el calor interno de la Tierra y la energía del Sol', 'solo la Luna', 'solo los seres vivos', 'el campo magnético'], answer: 0, why: 'Tectónica y agentes externos (agua, viento, hielo).' }
    ],
    help: { intro: 'En «Lab» deposita estratos, agrega una intrusión, levanta y erosiona la secuencia o recorre el ciclo de las rocas.', items: [['Estratos', 'cada color es una capa con su edad y fósil guía (capa Edades).'], ['Dique rojo', 'roca ígnea más joven que las capas que corta.'], ['Ciclo', 'el punto amarillo recorre los procesos que transforman las rocas.']], try: ['Deposita los estratos uno a uno: ¿cuál es el más antiguo?', 'Activa la intrusión y ordena los eventos del más antiguo al más reciente.', 'Levanta y erosiona: ¿qué capas quedan a la vista en el valle?'] }
  };
  MSim.create(def);
})();
