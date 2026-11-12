/* El universo en expansión — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, C = 299792;
  var N = 140, gal = [], inst, dm, tmpC, G = {}, lab = {};
  var S = { H0: 70, a: 1, obs: 0, sel: 7, t: 0, era: 6 };
  var ERA = [['Big Bang', '0', 'El espacio-tiempo comienza a expandirse desde un estado muy caliente y denso.'], ['Inflación', '10⁻³² s', 'Expansión rapidísima que alisa el universo.'], ['Núcleos ligeros', '3 min', 'Se forman núcleos de H, He y algo de Li.'], ['Fondo cósmico de microondas', '380 000 años', 'Se forman los átomos y la luz viaja libre: la radiación más antigua que vemos.'], ['Primeras estrellas', '≈ 200 millones de años', 'La gravedad junta el gas y se encienden las primeras estrellas.'], ['Galaxias', '≈ 1000 millones de años', 'Las estrellas se agrupan en galaxias y cúmulos.'], ['Sistema Solar', '≈ 9200 millones de años', 'Se forma el Sol, hace ≈ 4600 millones de años.'], ['Hoy', '13 800 millones de años', 'La expansión se acelera por la energía oscura.']];
  var OBS = [['ALMA', 'Chajnantor, 5000 m', 'radio milimétrico: nubes frías donde nacen estrellas'], ['VLT (Paranal)', 'Cerro Paranal, 2635 m', 'óptico e infrarrojo: exoplanetas y galaxias'], ['Observatorio Vera C. Rubin', 'Cerro Pachón, 2700 m', 'cartografía del cielo completo cada pocas noches'], ['ELT (en construcción)', 'Cerro Armazones, 3046 m', 'el mayor telescopio óptico del mundo (39 m)']];
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  function dMpc(i, j) { return gal[i] && gal[j] ? gal[i].p.distanceTo(gal[j].p) * 30 : 0; }   // 1 unidad = 30 Mpc (hoy)
  function vRec(d) { return S.H0 * d; }
  function zOf(v) { return Math.sqrt((1 + v / C) / (1 - Math.min(0.99, v / C))) - 1; }
  function age() { return 977.8 / S.H0; }   // 1/H0 en miles de millones de años
  function stages() {
    return [
      ['Corrimiento al rojo', 'Corrimiento', 'La luz de las galaxias lejanas llega desplazada hacia el rojo',
        '<p>Al descomponer la luz de una galaxia aparecen <b>líneas espectrales</b> de elementos como el hidrógeno. En casi todas las galaxias esas líneas están <b>desplazadas hacia el rojo</b> (mayor longitud de onda): z = Δλ/λ. Es la señal de que se <b>alejan</b> de nosotros. Las más lejanas tienen mayor corrimiento (gráfico «Espectro»).</p>'],
      ['Ley de Hubble', 'Hubble', 'v = H₀·d: cuanto más lejos, más rápido se aleja',
        '<p>En 1929 Edwin Hubble, con datos de Vesto Slipher y el método de distancias de Henrietta Leavitt, encontró que la <b>velocidad de alejamiento</b> es proporcional a la <b>distancia</b>: <b>v = H₀·d</b>. La constante de Hubble vale H₀ ≈ 70 km/s por megapársec (1 Mpc ≈ 3,26 millones de años luz). Cada punto del gráfico es una galaxia de la escena.</p>'],
      ['Expansión sin centro', 'Expansión', 'El espacio se estira: desde cualquier galaxia, las demás se alejan',
        '<p>La ley de Hubble no indica que estemos en el centro: es el <b>espacio mismo</b> el que se expande, como un pan con pasas que crece en el horno. Desde <b>cualquier</b> galaxia (cambia el observador) se ve lo mismo: todas las demás se alejan, y más rápido las más lejanas. El universo <b>no tiene centro</b>.</p>'],
      ['Edad del universo', 'Edad', 'Si todo se aleja, en el pasado estuvo junto: t ≈ 1/H₀',
        '<p>Si retrocedemos la película, las galaxias se acercan hasta juntarse. Una estimación simple de la edad es el tiempo que tardaría en llegar a su distancia actual: <b>t ≈ d/v = 1/H₀</b>. Con H₀ = 70 km/s/Mpc resulta ≈ <b>14 000 millones de años</b>; los cálculos detallados dan <b>13 800 millones de años</b>.</p>'],
      ['Historia del universo', 'Historia', 'Del Big Bang a las galaxias: el universo se expande y se enfría',
        '<p>El modelo del <b>Big Bang</b> describe un universo que empezó muy caliente y denso, y que al expandirse se <b>enfrió</b>: se formaron núcleos ligeros, luego átomos (liberando la radiación del <b>fondo cósmico de microondas</b>), después las primeras estrellas, las galaxias y, mucho más tarde, el Sistema Solar. Hoy la expansión se <b>acelera</b> por la <b>energía oscura</b>.</p>'],
      ['Astronomía en Chile', 'Chile', 'Cielos secos, altos y oscuros: Chile alberga gran parte de los telescopios del mundo',
        '<p>Mirar lejos es <b>mirar al pasado</b>: la luz de una galaxia a 1000 millones de años luz salió de ella hace 1000 millones de años. El <b>desierto de Atacama</b>, con su aire seco, gran altura y cielos sin contaminación lumínica, alberga observatorios como <b>ALMA</b>, el <b>VLT</b>, el <b>Vera C. Rubin</b> y el futuro <b>ELT</b>, que estudian desde la formación de estrellas hasta la expansión del universo.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.obs = 0; S.H0 = 70;
    if (i === 0) { S.a = 1; S.sel = [3, 7, 20, 40][Math.min(3, Math.floor(l * 4))]; }
    else if (i === 1) { S.a = 1; S.sel = [3, 7, 20, 40, 60][Math.min(4, Math.floor(l * 5))]; }
    else if (i === 2) { S.a = 0.75 + 0.25 * l; S.obs = l < 0.5 ? 0 : 5; }
    else if (i === 3) { S.a = 1 - 0.95 * l; }
    else if (i === 4) { S.era = Math.min(7, Math.floor(l * 8)); S.a = [0.04, 0.06, 0.08, 0.12, 0.2, 0.35, 0.7, 1][S.era]; }
    else { S.a = 1; S.era = 7; }
  }
  var def = {
    key: 'universo-expansion', title: 'El universo en expansión', subtitle: 'Simulador 3D · física', accent: { dark: '#9775fa', light: '#5f3dc4' }, bg: [0x05070d, 0x10142a],
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-2, 9, 24], target: [-2, 0, 0] }, { id: 'sup', label: 'Superior', pos: [-2, 28, 1], target: [-2, 0, 0] }],
    layers: [{ id: 'z', label: 'Color según corrimiento', icon: '◐' }, { id: 'lines', label: 'Líneas al observador', icon: '╱' }],
    build: function (ctx) {
      var s = ctx.scene, i; tmpC = new T.Color(); dm = new T.Object3D();
      for (i = 0; i < N; i++) { var r = i === 0 ? 0 : 1.6 + 11 * Math.pow(rnd(i), 0.8), th = 2 * Math.PI * rnd(i + 300), ph = Math.acos(2 * rnd(i + 600) - 1); gal.push({ p: new T.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th)), s: 0.18 + 0.22 * rnd(i + 900), rot: rnd(i + 1200) * 3 }); }
      gal.sort(function (a, b) { return a.p.length() - b.p.length(); });
      inst = new T.InstancedMesh(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({}), N); inst.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3); inst.frustumCulled = false; s.add(inst);
      var stars = []; for (i = 0; i < 600; i++) stars.push((rnd(i + 2000) - 0.5) * 160, (rnd(i + 3000) - 0.5) * 160, (rnd(i + 4000) - 0.5) * 160);
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(stars, 3)); s.add(new T.Points(sg, new T.PointsMaterial({ color: 0x8899bb, size: 0.15 })));
      G.ring = new T.Mesh(new T.TorusGeometry(0.6, 0.05, 8, 32), new T.MeshBasicMaterial({ color: 0xffd43b })); s.add(G.ring);
      G.sel = new T.Mesh(new T.TorusGeometry(0.5, 0.04, 8, 32), new T.MeshBasicMaterial({ color: 0x63e6be })); s.add(G.sel);
      G.lines = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.25 })); s.add(G.lines);
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var colz = ctx.layer('z'), o = gal[S.obs].p, pos = [], i;
      for (i = 0; i < N; i++) {
        var g = gal[i], p = g.p.clone().multiplyScalar(S.a); dm.position.copy(p); dm.rotation.set(g.rot, g.rot * 2, 0); dm.scale.set(g.s, g.s * 0.35, g.s); dm.updateMatrix(); inst.setMatrixAt(i, dm.matrix);
        var d = g.p.distanceTo(o) * 30, z = zOf(vRec(d));
        if (i === S.obs) tmpC.setHex(0xffd43b); else if (colz) tmpC.setRGB(clamp(0.55 + z * 4, 0, 1), clamp(0.75 - z * 2.5, 0.15, 1), clamp(1 - z * 5, 0.15, 1)); else tmpC.setHex(0xdee2ff);
        inst.setColorAt(i, tmpC); if (i !== S.obs && i % 3 === 0) pos.push(o.x * S.a, o.y * S.a, o.z * S.a, p.x, p.y, p.z);
      }
      inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
      G.lines.visible = ctx.layer('lines'); G.lines.geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      G.ring.position.copy(o).multiplyScalar(S.a); G.ring.lookAt(ctx.camera.position);
      var sp = gal[S.sel].p.clone().multiplyScalar(S.a); G.sel.position.copy(sp); G.sel.lookAt(ctx.camera.position); G.sel.visible = S.sel !== S.obs;
      var d = dMpc(S.sel, S.obs), v = vRec(d);
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      lab.a.pos(G.ring.position.x, G.ring.position.y + 1, G.ring.position.z).set(S.obs ? 'Observador en otra galaxia' : 'Vía Láctea (nosotros)', 'bl-lead').vis(true);
      if (G.sel.visible && S.a > 0.5) lab.b.pos(sp.x, sp.y + 0.9, sp.z).set('d = ' + fmt(d * S.a, 0) + ' Mpc · v = ' + fmt(v, 0) + ' km/s · z = ' + fmt(zOf(v), 3), 'bl-pos').vis(true);
      lab.c.pos(-2, 7.5, 0).set('Factor de escala a = ' + f2(S.a) + (S.a < 1 ? ' (pasado: todo más junto)' : ' (hoy)'), 'bl-d').vis(true);
      if (ctx.f && ctx.f.i === 4 && !ctx.P.manual) lab.d.pos(-2, -6, 0).set(ERA[S.era][0] + ' · ' + ERA[S.era][1], 'bl-warn').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.H0 && u.H0.set(S.H0); u.a && u.a.set(S.a); } },
    hud: function () { return { eq: { chip: 'H₀', name: 'Universo en expansión', body: '<div class="eqline"><small>Hubble</small>v = H₀·d</div><div class="eqline"><small>Corrimiento</small>z = Δλ/λ ≈ v/c</div><div class="eqline"><small>Edad aprox.</small>t ≈ 1/H₀</div>' }, legend: [{ label: 'Amarillo', color: '#ffd43b', text: 'galaxia del observador' }, { label: 'Del azul al rojo', color: '#ff8787', text: 'mayor corrimiento al rojo' }, { label: 'Anillo verde', color: '#63e6be', text: 'galaxia seleccionada' }] }; },
    measures: function () { var d = dMpc(S.sel, S.obs), v = vRec(d); return [['H₀', fmt(S.H0, 0) + ' km/s/Mpc'], ['Distancia', fmt(d, 0) + ' Mpc (' + fmt(d * 3.26, 0) + ' millones de años luz)'], ['Velocidad de alejamiento', fmt(v, 0) + ' km/s'], ['Corrimiento z', fmt(zOf(v), 4)], ['Edad ≈ 1/H₀', f1(age()) + ' mil millones de años'], ['Factor de escala', f2(S.a)]]; },
    ideas: ['Galaxias lejanas: líneas espectrales corridas al rojo.', '<b>v = H₀·d</b> (H₀ ≈ 70 km/s/Mpc).', 'Se expande el espacio: no hay centro.', 'Edad ≈ 1/H₀ ≈ 14 mil millones de años (13,8 medida).', 'Big Bang: caliente y denso → se expande y enfría.', 'Mirar lejos es mirar al pasado.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Universo'); el.appendChild(c);
      ui.H0 = kit.ui.slider({ label: 'Constante de Hubble H₀ (km/s/Mpc)', min: 50, max: 100, step: 1, value: S.H0, digits: 0, onInput: function (v) { ctx.goManual(); S.H0 = v; } });
      ui.a = kit.ui.slider({ label: 'Factor de escala a (1 = hoy)', min: 0.05, max: 1.5, step: 0.01, value: S.a, digits: 2, onInput: function (v) { ctx.goManual(); S.a = v; } });
      ui.sel = kit.ui.slider({ label: 'Galaxia seleccionada (n.º)', min: 1, max: N - 1, step: 1, value: S.sel, digits: 0, onInput: function (v) { ctx.goManual(); S.sel = v; } });
      c.appendChild(kit.ui.sliders([ui.H0, ui.a, ui.sel]));
      el.appendChild(ctx.btnRow([{ t: 'Observar desde otra galaxia', primary: true, fn: function () { ctx.goManual(); S.obs = S.obs ? 0 : 5 + Math.floor(Math.random() * 40); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var c2 = kit.ui.card('Observatorios en Chile'); c2.insertAdjacentHTML('beforeend', kit.ui.table(['Observatorio', 'Lugar', 'Qué estudia'], OBS)); el.appendChild(c2);
      var c3 = kit.ui.card('Línea de tiempo'); c3.insertAdjacentHTML('beforeend', kit.ui.table(['Etapa', 'Tiempo', 'Qué ocurre'], ERA)); el.appendChild(c3);
    },
    graphs: [
      { title: 'Diagrama de Hubble', h: 230, note: 'Cada punto es una galaxia de la escena vista desde el observador. La pendiente de la recta es H₀.', draw: function (cx, w, h, col) {
        var L = 52, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, dmax = 450, vmax = 100 * dmax, sx = function (d) { return L + pw * d / dmax; }, sy = function (v) { return Tp + ph - ph * v / vmax; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(vmax * i / 4)); cx.lineTo(L + pw, sy(vmax * i / 4)); cx.stroke(); cx.fillText(fmt(vmax * i / 4000, 0) + 'k', L - 5, sy(vmax * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= dmax; i += 150) cx.fillText(i, sx(i), h - B + 13); cx.fillText('d (Mpc)  ·  v (km/s)', L + pw / 2, h - 3);
        cx.strokeStyle = '#9775fa'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(dmax), sy(S.H0 * dmax)); cx.stroke(); cx.lineWidth = 1;
        for (i = 1; i < N; i++) { if (i === S.obs) continue; var d = dMpc(i, S.obs); if (d > dmax) continue; var sc = 1 + 0.06 * Math.sin(i * 7.3); cx.fillStyle = i === S.sel ? '#20c997' : 'rgba(255,146,43,.7)'; cx.beginPath(); cx.arc(sx(d), sy(S.H0 * d * sc), i === S.sel ? 5 : 2.6, 0, 7); cx.fill(); }
      } },
      { title: 'Espectro de la galaxia seleccionada', h: 160, note: 'Arriba: líneas del hidrógeno en el laboratorio. Abajo: las mismas líneas en la galaxia, corridas al rojo en un factor (1 + z).', draw: function (cx, w, h, col) {
        var L = 20, R = 20, pw = w - L - R, lo = 380, hi = 760, sx = function (l) { return L + pw * (l - lo) / (hi - lo); }, z = zOf(vRec(dMpc(S.sel, S.obs))), lines = [410.2, 434.0, 486.1, 656.3], k;
        function band(y, hh) { for (k = 0; k < pw; k += 2) { var l = lo + (hi - lo) * k / pw; cx.fillStyle = 'hsl(' + clamp(270 - (l - 380) * 0.75, 0, 270) + ',85%,55%)'; cx.fillRect(L + k, y, 2, hh); } }
        band(14, 40); band(84, 40); cx.fillStyle = '#000';
        lines.forEach(function (l) { cx.fillRect(sx(l) - 1, 14, 3, 40); var l2 = l * (1 + z); if (l2 < hi) cx.fillRect(sx(l2) - 1, 84, 3, 40); });
        cx.fillStyle = col.ink; cx.font = '11px system-ui'; cx.textAlign = 'left'; cx.fillText('Laboratorio', L, 10); cx.fillText('Galaxia · z = ' + fmt(z, 3), L, 80); cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.fillText('380 nm', sx(400), h - 6); cx.fillText('760 nm', sx(740), h - 6);
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, d = dMpc(S.sel, S.obs), v = vRec(d), z = zOf(v);
      return '<div class="card-kicker">Galaxia n.º ' + S.sel + '</div><table class="calc-table">' + row('Ley de Hubble', 'v = H₀·d = ' + fmt(S.H0, 0) + ' · ' + fmt(d, 0) + ' = <b>' + fmt(v, 0) + ' km/s</b>') + row('Corrimiento', 'z ≈ v/c = ' + fmt(v / C, 4) + ' (relativista: ' + fmt(z, 4) + ')') + row('Línea Hα (656,3 nm)', 'se observa en <b>' + fmt(656.3 * (1 + z), 1) + ' nm</b>') + row('Tiempo de viaje de la luz', '≈ <b>' + fmt(d * 3.26, 0) + ' millones de años</b>') + row('Edad del universo ≈ 1/H₀', '<b>' + f1(age()) + ' mil millones de años</b>') + '</table>';
    },
    quiz: [
      { q: 'El corrimiento al rojo de las galaxias indica que…', options: ['se alejan de nosotros', 'se acercan', 'están más calientes', 'son más jóvenes'], answer: 0, why: 'La longitud de onda observada aumenta.' },
      { q: 'Según la ley de Hubble, una galaxia al doble de distancia se aleja…', options: ['al doble de velocidad', 'a la misma velocidad', 'a la mitad', 'a cuatro veces'], answer: 0, why: 'v = H₀·d es proporcional.' },
      { q: 'Con H₀ = 70 km/s/Mpc, una galaxia a 100 Mpc se aleja a…', options: ['7000 km/s', '70 km/s', '170 km/s', '700 000 km/s'], answer: 0, why: '70 · 100 = 7000.' },
      { q: '¿Estamos en el centro de la expansión?', options: ['No: desde cualquier galaxia se ve lo mismo', 'Sí, la Vía Láctea es el centro', 'Sí, el Sol es el centro', 'No se sabe'], answer: 0, why: 'Se expande el espacio mismo.' },
      { q: 'La edad del universo es aproximadamente…', options: ['13 800 millones de años', '4600 millones de años', '6000 años', 'infinita'], answer: 0, why: '4600 millones es la edad del Sistema Solar.' },
      { q: 'La radiación de fondo de microondas se liberó cuando…', options: ['se formaron los primeros átomos', 'nació el Sol', 'se formó la Tierra', 'se encendieron las primeras galaxias'], answer: 0, why: '≈ 380 000 años después del Big Bang.' },
      { q: 'Chile concentra muchos observatorios porque…', options: ['el norte tiene cielos secos, altos y oscuros', 'está cerca del ecuador', 'hay menos gravedad', 'es de noche más horas'], answer: 0, why: 'El desierto de Atacama es ideal para observar.' },
      { q: 'Al observar una galaxia a 1000 millones de años luz la vemos…', options: ['como era hace 1000 millones de años', 'como es hoy', 'en el futuro', 'sin retraso'], answer: 0, why: 'La luz tardó ese tiempo en llegar.' }
    ],
    help: { intro: 'Las esferas aplanadas son galaxias; la amarilla es el observador. En «Lab» cambia H₀, el factor de escala (pasado o futuro) y la galaxia seleccionada, u observa desde otra galaxia.', items: [['Colores', 'del azul al rojo, mayor corrimiento al rojo.'], ['Gráficos', 'diagrama de Hubble y espectro con líneas del hidrógeno.'], ['Tablas', 'observatorios en Chile y línea de tiempo del universo.']], try: ['Observa desde otra galaxia: ¿cambia la forma del diagrama de Hubble?', 'Sube H₀: ¿qué le pasa a la edad estimada?', 'Elige una galaxia lejana y mira dónde aparece la línea Hα.'] }
  };
  MSim.create(def);
})();
