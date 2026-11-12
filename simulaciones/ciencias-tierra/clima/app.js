/* Clima y cambio climático — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, SIG = 5.67e-8;
  // datos aproximados: CO₂ anual en Mauna Loa (NOAA) y anomalía de temperatura global respecto de 1951–1980 (NASA GISTEMP)
  var DAT = [[1960, 317, -0.03], [1965, 320, -0.10], [1970, 326, 0.03], [1975, 331, -0.01], [1980, 339, 0.26], [1985, 346, 0.12], [1990, 354, 0.45], [1995, 361, 0.45], [2000, 370, 0.39], [2005, 380, 0.68], [2010, 390, 0.72], [2015, 401, 0.90], [2020, 414, 1.01], [2023, 421, 1.17], [2024, 424, 1.28]];
  var S = { S0: 1361, alb: 0.30, gh: true, co2: 280, fb: true, yr: 2024 };
  var G = {}, lab = {}, rays = [], irs = [];
  function ice(Ts) { return clamp(0.11 - 0.012 * (Ts - 288), 0, 0.4); }
  function model() {
    var Ts = 288, a = S.alb, Te, k;
    for (k = 0; k < 30; k++) { a = S.fb ? clamp(S.alb + 0.6 * (ice(Ts) - 0.11), 0.1, 0.6) : S.alb; Te = Math.pow(S.S0 / 4 * (1 - a) / SIG, 0.25); var dF = 5.35 * Math.log(S.co2 / 280), Gh = S.gh ? 33 + 0.8 * dF * (S.fb ? 1 : 0.75) : 0; Ts = Te + Gh; }
    return { Te: Te, Ts: Ts, a: a, dF: 5.35 * Math.log(S.co2 / 280), ice: ice(Ts) };
  }
  function stages() {
    return [
      ['El clima como sistema', 'Sistema', 'Atmósfera, océanos, hielo, suelos y seres vivos interactúan',
        '<p>El <b>tiempo atmosférico</b> es el estado de la atmósfera en un momento (hoy llueve); el <b>clima</b> es el promedio durante décadas en un lugar. El clima es un <b>sistema dinámico</b>: la <b>atmósfera</b>, la <b>hidrósfera</b> (océanos), la <b>criósfera</b> (hielos), la <b>geósfera</b> y la <b>biósfera</b> intercambian energía, agua y carbono, y un cambio en una parte afecta a las demás.</p>'],
      ['Balance de energía', 'Balance', 'Lo que entra del Sol debe igualar lo que sale como infrarrojo',
        '<p>La Tierra recibe <b>luz solar</b> (≈ 1361 W/m² fuera de la atmósfera) y refleja ≈ 30 % (el <b>albedo</b>). El resto la calienta y ella emite <b>radiación infrarroja</b>. En equilibrio, la energía que entra iguala a la que sale. Si no hubiera atmósfera, ese equilibrio daría una temperatura media de ≈ <b>−18 °C</b>.</p>'],
      ['Efecto invernadero natural', 'Invernadero', 'Los gases de efecto invernadero devuelven parte del infrarrojo: +33 °C',
        '<p>El vapor de agua, el CO₂, el metano y otros <b>gases de efecto invernadero</b> absorben parte del infrarrojo que emite la superficie y lo reemiten en todas direcciones, también hacia abajo. Así la temperatura media sube de −18 °C a ≈ <b>15 °C</b>. Este <b>efecto invernadero natural</b> hace posible la vida tal como la conocemos.</p>'],
      ['Albedo y retroalimentación del hielo', 'Albedo', 'Menos hielo, menos reflexión, más calentamiento',
        '<p>El hielo y la nieve reflejan mucha luz (albedo alto); el océano y los bosques, poca. Si la Tierra se calienta, se derrite hielo, la superficie se oscurece y absorbe más energía: se calienta aún más. Es una <b>retroalimentación positiva</b>, que amplifica los cambios. El vapor de agua produce otra: el aire más cálido retiene más vapor, que es un gas de efecto invernadero.</p>'],
      ['El aumento del CO₂', 'CO₂', 'De 280 a más de 420 ppm desde 1850: la Tierra se calentó ≈ 1,2 °C',
        '<p>Desde la Revolución Industrial la quema de <b>combustibles fósiles</b> y la deforestación elevaron el CO₂ de <b>280 ppm</b> a más de <b>420 ppm</b>, como muestran las mediciones de Mauna Loa (curva de Keeling). Más CO₂ significa un <b>forzamiento radiativo</b> ΔF = 5,35·ln(C/280) W/m², y la temperatura global ya subió ≈ <b>1,2 °C</b>. Los datos del gráfico son mediciones reales.</p>'],
      ['Escenarios y acción', 'Futuro', 'El calentamiento futuro depende de cuánto CO₂ emitamos',
        '<p>Si el CO₂ llegara a 560 ppm (el doble del preindustrial), el modelo predice ≈ <b>3 °C</b> más. Consecuencias: olas de calor, <b>sequías</b> (Chile central vive una megasequía desde 2010), retroceso de <b>glaciares</b>, alza del nivel del mar y pérdida de biodiversidad. La <b>mitigación</b> (energías renovables, eficiencia, transporte limpio, conservar bosques) y la <b>adaptación</b> reducen los riesgos.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.S0 = 1361; S.alb = 0.3; S.fb = true;
    if (i === 0) { S.gh = true; S.co2 = 280; }
    else if (i === 1) { S.gh = false; S.co2 = 280; S.fb = false; }
    else if (i === 2) { S.gh = l > 0.4; S.co2 = 280; S.fb = false; }
    else if (i === 3) { S.gh = true; S.co2 = 280; S.alb = 0.3 + 0.08 * Math.sin(l * Math.PI * 2); }
    else if (i === 4) { S.gh = true; var k = Math.min(DAT.length - 1, Math.floor(l * DAT.length)); S.yr = DAT[k][0]; S.co2 = DAT[k][1]; }
    else { S.gh = true; S.co2 = [420, 450, 560, 800][Math.min(3, Math.floor(l * 4))]; }
  }
  var def = {
    key: 'clima', title: 'Clima y cambio climático', subtitle: 'Simulador 3D · ciencias de la Tierra', accent: { dark: '#4dabf7', light: '#1864ab' }, bg: [0x05070d, 0x0f1b2d],
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.5, 2.5, 16], target: [-1.5, 0, 0] }, { id: 'polo', label: 'Polo', pos: [-1.5, 15, 4], target: [-1.5, 0, 0] }],
    layers: [{ id: 'sun', label: 'Luz solar', icon: '☀' }, { id: 'ir', label: 'Infrarrojo', icon: '〰' }],
    build: function (ctx) {
      var s = ctx.scene; G.earth = new T.Mesh(new T.SphereGeometry(3, 48, 32), new T.MeshStandardMaterial({ color: 0x1c7ed6, roughness: 0.6 })); s.add(G.earth);
      G.land = []; for (var k = 0; k < 7; k++) { var c = new T.Mesh(new T.SphereGeometry(3.02, 24, 16, k * 0.9, 0.55, 0.9 + (k % 3) * 0.25, 0.5), new T.MeshStandardMaterial({ color: 0x5c940d, roughness: 0.9 })); G.earth.add(c); G.land.push(c); }
      G.capN = new T.Mesh(new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, 0, 0.5), new T.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3 })); G.earth.add(G.capN);
      G.capS = new T.Mesh(new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, Math.PI - 0.5, 0.5), new T.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3 })); G.earth.add(G.capS);
      G.atm = new T.Mesh(new T.SphereGeometry(3.7, 40, 28), new T.MeshBasicMaterial({ color: 0xff8787, transparent: true, opacity: 0.12, side: T.BackSide, depthWrite: false })); s.add(G.atm);
      G.sunL = new T.DirectionalLight(0xffffff, 1.2); G.sunL.position.set(-20, 3, 6); s.add(G.sunL);
      for (k = 0; k < 6; k++) { var a = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(-11, -2.5 + k, 1), 7, 0xffd43b, 0.5, 0.35); s.add(a); rays.push(a); }
      for (k = 0; k < 8; k++) { var b = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 2, 0xff6b6b, 0.4, 0.28); s.add(b); irs.push(b); }
      ['a', 'b', 'c', 'd'].forEach(function (k2) { lab[k2] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var m = model(), sun = ctx.layer('sun'), ir = ctx.layer('ir'), tC = m.Ts - 273.15;
      G.earth.rotation.y += dt * 0.15;
      var capA = clamp(0.25 + m.ice * 2.2, 0.05, 1.3); if (Math.abs(capA - (G.lastCap || 0)) > 0.01) { G.lastCap = capA; G.capN.geometry.dispose(); G.capN.geometry = new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, 0, capA); G.capS.geometry.dispose(); G.capS.geometry = new T.SphereGeometry(3.04, 32, 12, 0, Math.PI * 2, Math.PI - capA, capA); }
      G.atm.visible = S.gh; G.atm.material.opacity = 0.08 + 0.2 * clamp(m.dF / 8 + 0.3, 0, 1);
      rays.forEach(function (r, k) { r.visible = sun; var refl = k < Math.round(6 * m.a); r.setColor(new T.Color(refl ? 0xfff3bf : 0xffd43b)); r.setLength(refl ? 6.2 : 7.6, 0.5, 0.35); });
      var back = S.gh ? clamp(0.45 + m.dF / 12, 0, 0.9) : 0;
      irs.forEach(function (b, k) { b.visible = ir; var ang = (k / irs.length) * Math.PI * 2 + 0.3, dir = new T.Vector3(Math.cos(ang), Math.sin(ang), 0.2).normalize(), trapped = k < Math.round(back * irs.length); b.position.copy(dir.clone().multiplyScalar(3.1)); b.setDirection(dir); b.setLength(trapped ? 0.8 : 2.4, 0.35, 0.25); if (trapped) { b.position.copy(dir.clone().multiplyScalar(3.95)); b.setDirection(dir.clone().negate()); } });
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      lab.a.pos(-1.5, 4.8, 0).set('Temperatura media ≈ ' + f1(tC) + ' °C', tC > 16 ? 'bl-warn' : tC < 0 ? 'bl-lead' : 'bl-neg').vis(true);
      lab.b.pos(-8, 3.6, 1).set('Albedo ' + fmt(m.a * 100, 0) + ' % reflejado', 'bl-d').vis(sun);
      lab.c.pos(4.8, -3.6, 0).set(S.gh ? 'CO₂ = ' + fmt(S.co2, 0) + ' ppm · ΔF = ' + f2(m.dF) + ' W/m²' : 'Sin efecto invernadero', 'bl-pos').vis(true);
      if (ctx.f && ctx.f.i === 4 && !ctx.P.manual) lab.d.pos(4.8, 3.8, 0).set('Año ' + S.yr, 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.co2 && u.co2.set(S.co2); u.alb && u.alb.set(S.alb); u.S0 && u.S0.set(S.S0); } },
    hud: function () { var m = model(); return { eq: { chip: '🌡', name: 'Balance de energía', body: '<div class="eqline"><small>Equilibrio sin atmósfera</small>S₀/4·(1 − α) = σT⁴ → ' + f1(m.Te - 273.15) + ' °C</div><div class="eqline"><small>Forzamiento del CO₂</small>ΔF = 5,35·ln(C/280)</div><div class="eqline"><small>Respuesta</small>ΔT ≈ 0,8 K por W/m²</div>' }, legend: [{ label: 'Amarillo', color: '#ffd43b', text: 'luz solar absorbida' }, { label: 'Crema', color: '#fff3bf', text: 'luz reflejada (albedo)' }, { label: 'Rojo', color: '#ff6b6b', text: 'infrarrojo (las flechas que vuelven: efecto invernadero)' }] }; },
    measures: function () { var m = model(); return [['Constante solar', fmt(S.S0, 0) + ' W/m²'], ['Albedo efectivo', fmt(m.a * 100, 1) + ' %'], ['T sin atmósfera', f1(m.Te - 273.15) + ' °C'], ['CO₂', fmt(S.co2, 0) + ' ppm'], ['Forzamiento ΔF', f2(m.dF) + ' W/m²'], ['T media superficial', f1(m.Ts - 273.15) + ' °C'], ['Respecto del preindustrial', (m.Ts - 288 >= 0 ? '+' : '') + f1(m.Ts - 288) + ' °C'], ['Hielo (fracción)', fmt(m.ice * 100, 1) + ' %']]; },
    ideas: ['Tiempo ≠ clima (promedio de décadas).', 'Sin atmósfera: −18 °C; con efecto invernadero: +15 °C.', 'Albedo: fracción de luz reflejada (hielo alto, océano bajo).', 'Retroalimentaciones: hielo–albedo y vapor de agua.', 'CO₂: 280 → 420+ ppm; ΔF = 5,35·ln(C/280).', 'Mitigación y adaptación reducen los riesgos.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Modelo climático simple'); el.appendChild(c);
      ui.co2 = kit.ui.slider({ label: 'CO₂ (ppm)', min: 180, max: 1000, step: 5, value: S.co2, digits: 0, onInput: function (v) { ctx.goManual(); S.co2 = v; S.gh = true; } });
      ui.alb = kit.ui.slider({ label: 'Albedo base', min: 0.1, max: 0.6, step: 0.01, value: S.alb, digits: 2, onInput: function (v) { ctx.goManual(); S.alb = v; } });
      ui.S0 = kit.ui.slider({ label: 'Constante solar (W/m²)', min: 1200, max: 1500, step: 5, value: S.S0, digits: 0, onInput: function (v) { ctx.goManual(); S.S0 = v; } });
      c.appendChild(kit.ui.sliders([ui.co2, ui.alb, ui.S0]));
      c.appendChild(ctx.btnRow([{ t: 'Atmósfera sí / no', fn: function () { ctx.goManual(); S.gh = !S.gh; } }, { t: 'Retroalimentaciones sí / no', fn: function () { ctx.goManual(); S.fb = !S.fb; } }]));
      el.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Datos: CO₂ y temperatura global (1960–2024)', h: 230, note: 'Barras: anomalía de temperatura respecto de 1951–1980 (NASA GISTEMP, aprox.). Línea: CO₂ en Mauna Loa (NOAA, aprox.).', draw: function (cx, w, h, col) {
        var L = 40, R = 40, Tp = 12, B = 28, pw = w - L - R, ph = h - Tp - B, sx = function (y) { return L + pw * (y - 1958) / 68; }, st = function (a) { return Tp + ph - ph * (a + 0.3) / 1.7; }, sc = function (c) { return Tp + ph - ph * (c - 300) / 130; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [-0.25, 0, 0.5, 1, 1.25].forEach(function (a) { cx.beginPath(); cx.moveTo(L, st(a)); cx.lineTo(L + pw, st(a)); cx.stroke(); cx.fillText(fmt(a, 2), L - 4, st(a) + 3); });
        cx.textAlign = 'left'; [320, 360, 400, 420].forEach(function (c) { cx.fillText(c, L + pw + 4, sc(c) + 3); });
        cx.textAlign = 'center'; for (i = 1960; i <= 2020; i += 20) cx.fillText(i, sx(i), h - B + 13); cx.fillText('año  ·  °C (izq.)  ·  ppm CO₂ (der.)', L + pw / 2, h - 3);
        DAT.forEach(function (d) { cx.fillStyle = d[2] >= 0 ? 'rgba(250,82,82,.7)' : 'rgba(77,171,247,.7)'; var y0 = st(0), y1 = st(d[2]); cx.fillRect(sx(d[0]) - 6, Math.min(y0, y1), 12, Math.abs(y1 - y0)); });
        cx.strokeStyle = '#fab005'; cx.lineWidth = 2.4; cx.beginPath(); DAT.forEach(function (d, k) { if (k) cx.lineTo(sx(d[0]), sc(d[1])); else cx.moveTo(sx(d[0]), sc(d[1])); }); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Modelo: temperatura según el CO₂', h: 210, note: 'Temperatura de equilibrio del modelo con y sin retroalimentaciones. El punto es el estado actual.', draw: function (cx, w, h, col) {
        var L = 40, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, sx = function (c) { return L + pw * (c - 180) / 820; }, sy = function (t) { return Tp + ph - ph * (t - 8) / 16; }, sv = { co2: S.co2, fb: S.fb, gh: S.gh }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 8; i <= 24; i += 4) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i, L - 4, sy(i) + 3); }
        cx.textAlign = 'center'; [280, 420, 560, 800, 1000].forEach(function (c) { cx.fillText(c, sx(c), h - B + 13); }); cx.fillText('CO₂ (ppm)  ·  T media (°C)', L + pw / 2, h - 3);
        [[true, '#e03131'], [false, '#4dabf7']].forEach(function (q) { cx.strokeStyle = q[1]; cx.lineWidth = 2.2; cx.beginPath(); for (var k = 0; k <= 80; k++) { S.co2 = 180 + 820 * k / 80; S.fb = q[0]; S.gh = true; var t = model().Ts - 273.15; if (k) cx.lineTo(sx(S.co2), sy(t)); else cx.moveTo(sx(S.co2), sy(t)); } cx.stroke(); }); cx.lineWidth = 1;
        S.co2 = sv.co2; S.fb = sv.fb; S.gh = sv.gh; var t0 = model().Ts - 273.15; cx.fillStyle = '#fff'; cx.strokeStyle = '#1864ab'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.co2), sy(clamp(t0, 8, 24)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = model();
      return '<div class="card-kicker">Balance de energía</div><table class="calc-table">' + row('Energía absorbida', 'S₀/4·(1 − α) = ' + fmt(S.S0, 0) + '/4·(1 − ' + f2(m.a) + ') = <b>' + f1(S.S0 / 4 * (1 - m.a)) + ' W/m²</b>') + row('T sin atmósfera', '(absorbida/σ)^¼ = <b>' + f1(m.Te) + ' K = ' + f1(m.Te - 273.15) + ' °C</b>') + row('Forzamiento del CO₂', '5,35·ln(' + fmt(S.co2, 0) + '/280) = <b>' + f2(m.dF) + ' W/m²</b>') + row('T superficial', '<b>' + f1(m.Ts - 273.15) + ' °C</b>') + row('Duplicar el CO₂ (560 ppm)', 'ΔF = 3,7 W/m² → ≈ +3 °C') + '</table><p class="muted small">Modelo de una capa, ilustrativo: los modelos climáticos reales resuelven la atmósfera y el océano en 3D.</p>';
    },
    quiz: [
      { q: 'La diferencia entre tiempo atmosférico y clima es que el clima…', options: ['es el promedio de muchos años', 'cambia cada día', 'solo incluye la lluvia', 'no depende del océano'], answer: 0, why: 'Clima: estadística de décadas.' },
      { q: 'Sin efecto invernadero, la temperatura media de la Tierra sería…', options: ['≈ −18 °C', '≈ 15 °C', '≈ 30 °C', '≈ 0 °C exactos'], answer: 0, why: 'Equilibrio radiativo sin atmósfera.' },
      { q: 'El albedo es…', options: ['la fracción de luz solar reflejada', 'la cantidad de CO₂', 'la temperatura del océano', 'la humedad del aire'], answer: 0, why: 'El hielo tiene albedo alto.' },
      { q: 'Si se derrite hielo polar, la Tierra…', options: ['absorbe más luz y se calienta más', 'refleja más luz', 'no cambia', 'se enfría'], answer: 0, why: 'Retroalimentación hielo–albedo.' },
      { q: 'La concentración de CO₂ preindustrial era de unas…', options: ['280 ppm', '420 ppm', '1000 ppm', '28 ppm'], answer: 0, why: 'Hoy supera las 420 ppm.' },
      { q: 'La principal causa del aumento reciente del CO₂ es…', options: ['la quema de combustibles fósiles', 'los volcanes', 'la respiración humana', 'el Sol'], answer: 0, why: 'Además de la deforestación.' },
      { q: 'Los gases de efecto invernadero calientan la superficie porque…', options: ['absorben y reemiten parte del infrarrojo hacia abajo', 'producen calor químico', 'bloquean toda la luz solar', 'reflejan la luz visible'], answer: 0, why: 'Son casi transparentes a la luz visible pero absorben IR.' },
      { q: 'Una medida de mitigación del cambio climático es…', options: ['generar electricidad con energías renovables', 'quemar más carbón', 'talar bosques', 'aumentar el uso del auto'], answer: 0, why: 'Reduce las emisiones de CO₂.' }
    ],
    help: { intro: 'En «Lab» cambia el CO₂, el albedo y la constante solar; activa o desactiva la atmósfera y las retroalimentaciones para ver cómo cambia la temperatura de equilibrio.', items: [['Flechas amarillas', 'luz solar (crema: la reflejada por el albedo).'], ['Flechas rojas', 'infrarrojo; las que vuelven hacia la Tierra representan el efecto invernadero.'], ['Gráficos', 'datos reales aproximados de CO₂ y temperatura, y la respuesta del modelo.']], try: ['Quita la atmósfera: ¿qué temperatura resulta?', 'Duplica el CO₂ (560 ppm) con y sin retroalimentaciones.', 'Sube el albedo a 0,5 (una Tierra muy helada): ¿qué pasa?'] }
  };
  MSim.create(def);
})();
