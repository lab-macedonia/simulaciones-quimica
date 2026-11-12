/* Química ambiental y química verde — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var RX = [
    { n: 'Diels–Alder (butadieno + eteno)', ae: 100, mw: [54.09, 28.05], mp: 82.14, note: 'cicloadición: todos los átomos pasan al producto', sector: 'síntesis orgánica' },
    { n: 'Hidrogenación de eteno', ae: 100, mw: [28.05, 2.02], mp: 30.07, note: 'adición: 100 % de economía atómica', sector: 'petroquímica' },
    { n: 'Haber–Bosch (N₂ + 3H₂ → 2NH₃)', ae: 100, mw: [28.01, 6.05], mp: 34.06, note: 'aprovecha todos los átomos (pero alto costo energético)', sector: 'química básica' },
    { n: 'SN2: bromoetano + NaOH', ae: 30.9, mw: [108.97, 40.0], mp: 46.07, note: 'sustitución: genera NaBr como residuo', sector: 'síntesis orgánica' },
    { n: 'Wittig (ciclohexanona + Ph₃P=CH₂)', ae: 25.7, mw: [98.14, 276.3], mp: 96.17, note: 'el Ph₃P=O (278 g/mol) es un residuo enorme', sector: 'química fina' },
    { n: 'Ibuprofeno, síntesis de Boots (6 pasos)', ae: 40, mw: [], mp: 206.3, note: 'ruta clásica con muchos residuos', sector: 'farmacéutica' },
    { n: 'Ibuprofeno, proceso BHC (3 pasos)', ae: 77, mw: [], mp: 206.3, note: 'catálisis (HF recuperado, Raney-Ni, Pd): premio de química verde 1997', sector: 'farmacéutica' }
  ];
  var PR = ['Prevenir los residuos', 'Economía atómica', 'Síntesis menos peligrosas', 'Diseño de productos más seguros', 'Disolventes y auxiliares inocuos', 'Eficiencia energética', 'Materias primas renovables', 'Evitar derivados innecesarios', 'Catálisis', 'Diseño para la degradación', 'Análisis en tiempo real', 'Química intrínsecamente segura'];
  var SEC = [['Petroquímica', 0.1], ['Química básica', 3], ['Química fina', 20], ['Farmacéutica', 60]];
  var S = { mode: 'oz', cl: 0.5, co2: 420, so2: 10, rx: 0, y: 90, solv: 5, p: 0 }, g = null, lab = [], earth = null, atmo = null, oz = [], ir = [], drops = [], lake = null, bars = [], rays = [];
  function ozone() { return Math.max(5, 100 - 62 * Math.pow(S.cl, 0.9)); }
  function forcing(c) { return 5.35 * Math.log(c / 280); }
  function dT(c) { return 0.8 * forcing(c); }
  function ph() { return -Math.log10(Math.pow(10, -5.6) + 2.4e-6 * S.so2); }
  function efac() { var r = RX[S.rx], ae = r.ae / 100, y = S.y / 100; return (1 / (ae * y) - 1) + S.solv; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function stages() {
    return [
      ['La capa de ozono', 'Ozono', 'O₃ absorbe UV-B y UV-C en la estratosfera; los CFC la destruyen catalíticamente',
        '<p>En la estratosfera (15–35 km) el ciclo de Chapman produce y destruye <b>O₃</b>: <b>O₂ + hν(UV) → 2O</b>; <b>O + O₂ → O₃</b>; <b>O₃ + hν → O₂ + O</b>. El ozono absorbe la radiación UV dañina. Los <b>clorofluorocarbonos (CFC)</b> liberan <b>Cl·</b> con luz UV: <b>Cl· + O₃ → ClO· + O₂</b>; <b>ClO· + O → Cl· + O₂</b>. El Cl· se regenera: un solo átomo destruye ~10⁵ moléculas de O₃. El <b>Protocolo de Montreal</b> prohibió los CFC.</p>'],
      ['Efecto invernadero', 'Invernadero', 'CO₂, CH₄, N₂O y H₂O absorben el infrarrojo terrestre y lo reemiten',
        '<p>La Tierra recibe luz visible y emite <b>infrarrojo</b>. Los <b>gases de efecto invernadero</b> (CO₂, CH₄, N₂O, H₂O) absorben ese IR (por vibraciones moleculares que cambian el momento dipolar) y lo reemiten hacia la superficie: sin ellos la T media sería ≈ −18 °C en vez de +15 °C. Más CO₂ aumenta el <b>forzamiento radiativo</b> ΔF = 5,35·ln(C/C₀) W/m² (C₀ = 280 ppm).</p>'],
      ['Lluvia ácida', 'Lluvia ácida', 'SO₂ y NOₓ se oxidan y forman H₂SO₄ y HNO₃ disueltos en las gotas',
        '<p>La lluvia normal tiene pH ≈ 5,6 por el CO₂ disuelto. El <b>SO₂</b> (combustión de carbón y petróleo) se oxida a SO₃ y forma <b>H₂SO₄</b>; los <b>NOₓ</b> de los motores forman <b>HNO₃</b>. La lluvia ácida (pH &lt; 5,6) daña bosques, acidifica lagos, corroe mármol (CaCO₃ + H₂SO₄ → CaSO₄) y moviliza Al³⁺ tóxico. Se mitiga con desulfuración de gases y convertidores catalíticos.</p>'],
      ['Química verde: economía atómica', 'Economía atómica', 'AE = M(producto) / ΣM(reactivos) × 100',
        '<p>La <b>química verde</b> busca diseñar procesos que reduzcan o eliminen sustancias peligrosas. Un indicador clave es la <b>economía atómica</b>: <b>AE = (masa molar del producto deseado)/(suma de masas molares de los reactivos) × 100</b>. Las adiciones y cicloadiciones (Diels–Alder, hidrogenación) tienen 100 %; las sustituciones y las reacciones de Wittig, mucho menos. Elige una ruta en el panel.</p>'],
      ['Factor E y los 12 principios', 'Factor E', 'E = kg de residuo / kg de producto: farmacéutica 25–100, petroquímica < 0,1',
        '<p>El <b>factor E</b> (Sheldon) es <b>kg de residuo por kg de producto</b>. Depende de la economía atómica, del <b>rendimiento</b> y de los disolventes. Va desde &lt; 0,1 en petroquímica hasta 25–100 en la industria farmacéutica. Los <b>12 principios de la química verde</b> (Anastas y Warner) guían el diseño: prevención, economía atómica, disolventes inocuos, catálisis, energía eficiente, materias renovables, degradabilidad…</p>']
    ];
  }
  var def = {
    key: 'quimica-ambiental-verde', title: 'Química ambiental y verde', subtitle: 'Simulador 3D · química general', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 8, 24], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 26], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 26, 3], target: [0, 0, 0] }],
    layers: [{ id: 'a', label: 'Moléculas / rayos', icon: '✦' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      earth = new T.Mesh(new T.SphereGeometry(5, 32, 24), new T.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.8 })); earth.position.set(0, -7, 0); g.add(earth);
      var oc = new T.Mesh(new T.SphereGeometry(5.02, 32, 24), new T.MeshStandardMaterial({ color: 0x1c7ed6, transparent: true, opacity: 0.55 })); oc.position.copy(earth.position); g.add(oc);
      atmo = new T.Mesh(new T.SphereGeometry(7.2, 32, 24), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.12, depthWrite: false })); atmo.position.copy(earth.position); g.add(atmo);
      for (i = 0; i < 40; i++) { var o = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0x69db7c })); o.userData = { a: Math.random() * 6.28, b: Math.random() * 1.2 + 0.1, r: 6.0 + Math.random() * 0.8 }; g.add(o); oz.push(o); }
      for (i = 0; i < 24; i++) { var r = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.4, 6), new T.MeshBasicMaterial({ color: 0xff6b6b })); r.userData = { a: -0.6 + 1.2 * (i / 24) * 1.0 + 0, o: i / 24 }; g.add(r); ir.push(r); }
      for (i = 0; i < 40; i++) { var d = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0x74c0fc })); d.userData = { x: -9 + Math.random() * 18, o: Math.random() }; g.add(d); drops.push(d); }
      lake = new T.Mesh(new T.BoxGeometry(20, 0.8, 6), new T.MeshStandardMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.7 })); lake.position.set(0, -7, 0); g.add(lake);
      for (i = 0; i < 4; i++) { var b = new T.Mesh(new T.BoxGeometry(2.4, 1, 2.4), new T.MeshStandardMaterial({ color: [0x4dabf7, 0x40c057, 0xfa5252, 0xfab005][i] })); b.visible = false; g.add(b); bars.push(b); }
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, now = ctx.now; if (!P.manual) { S.mode = ['oz', 'oz', 'gh', 'ac', 'gc'][i === 1 ? 2 : (i === 2 ? 3 : i)] || 'oz'; S.mode = ['oz', 'gh', 'ac', 'gc', 'gc'][i]; if (i === 0) S.cl = f.local; if (i === 1) S.co2 = 280 + 520 * f.local; if (i === 2) S.so2 = 80 * f.local; if (i === 3) { S.rx = Math.min(6, Math.floor(f.local * 7)); S.y = 90; S.solv = 0; } if (i === 4) { S.rx = 6 - Math.min(2, Math.floor(f.local * 3)); S.solv = 5 * (1 - f.local); S.y = 90; } }
      lab.forEach(function (l) { l.vis(false); }); oz.forEach(function (o) { o.visible = false; }); ir.forEach(function (r) { r.visible = false; }); drops.forEach(function (d) { d.visible = false; }); lake.visible = false; bars.forEach(function (b) { b.visible = false; }); earth.visible = S.mode !== 'gc'; atmo.visible = S.mode !== 'gc'; earth.parent.children[1].visible = S.mode !== 'gc';
      var aOn = ctx.layer('a'); earth.rotation.y = now * 0.1;
      if (S.mode === 'oz') {
        var o3 = ozone(), nO = Math.round(40 * o3 / 100); oz.forEach(function (o, j) { o.visible = aOn && j < nO; var u = o.userData, a = u.a + now * 0.1; o.position.set(Math.cos(a) * u.r * 1.1, -7 + Math.sin(a * 1.0 + u.b) * 5.6 + 0.6 * Math.sin(now + j), Math.sin(a * 1.7) * 3); o.position.set(earth.position.x + 6.4 * Math.cos(a) * Math.cos(u.b - 0.6), earth.position.y + 6.4 * Math.sin(a) * Math.cos(u.b - 0.6) * 0 + 6.4 * Math.sin(u.b - 0.6) + 0.0, 6.4 * Math.sin(a) * Math.cos(u.b - 0.6)); });
        ir.forEach(function (r, j) { r.visible = aOn; var uv = (now * 0.5 + j / ir.length) % 1; r.position.set(-9 + 18 * (j / ir.length), 12 - uv * 16.5, 0); r.material.color.setHex(0xb197fc); r.visible = aOn && (r.position.y > earth.position.y + 5.3); var abs = (o3 / 100); if (r.position.y < 6.5 && r.position.y > 4) r.scale.y = 0.4 + 0.6 * (1 - abs) + 0.2; else r.scale.y = 1; });
        lab[0].pos(0, 11.5, 0).set('UV solar atraviesa la estratosfera', 'bl-lead').vis(true); lab[1].pos(8, 1.5, 0).set('capa de O₃: ' + fmt(o3, 0) + ' % del valor original', o3 < 70 ? 'bl-neg' : 'bl-pos').vis(true); lab[2].pos(0, -13.5, 0).set('Cl· catalítico: ' + fmt(S.cl * 3, 1) + ' ppb de Cl estratosférico', 'bl-d').vis(true);
      } else if (S.mode === 'gh') {
        var df = forcing(S.co2), t = dT(S.co2), f2 = Math.min(1, Math.max(0, (S.co2 - 280) / 600));
        ir.forEach(function (r, j) { r.material.color.setHex(0xff6b6b); r.visible = aOn; var u = (now * 0.4 + j / ir.length) % 1, y0 = earth.position.y + 5.2; if (u < 0.55 + 0 * f2) { r.position.set(-8 + 16 * (j / ir.length), y0 + u * 14, 0); r.rotation.z = 0; } else { var back = (j % 24) / 24 < 0.2 + 0.7 * f2; if (back) { r.position.set(-8 + 16 * (j / ir.length), y0 + 7.7 - (u - 0.55) * 8, 0); r.material.color.setHex(0xffa94d); } else { r.position.set(-8 + 16 * (j / ir.length), y0 + u * 14, 0); } } });
        earth.material.color.setRGB(0.18 + 0.5 * f2, 0.62 - 0.35 * f2, 0.27 - 0.1 * f2); atmo.material.color.setRGB(0.45 + 0.55 * f2, 0.75 - 0.4 * f2, 1 - 0.7 * f2); atmo.material.opacity = 0.12 + 0.12 * f2;
        lab[0].pos(0, 11.5, 0).set('CO₂ = ' + fmt(S.co2, 0) + ' ppm · ΔF = ' + fmt(df, 2) + ' W/m² · ΔT ≈ +' + fmt(t, 1) + ' °C', 'bl-lead').vis(true); lab[1].pos(0, -13.5, 0).set('IR emitido (rojo) · parte reemitida a la superficie (naranja)', 'bl-d').vis(true);
      } else if (S.mode === 'ac') {
        var pH = ph(); drops.forEach(function (d) { d.visible = aOn; var u = (now * 0.5 + d.userData.o) % 1; d.position.set(d.userData.x, 9 - u * 15.5, 0); var t = (pH - 3) / 3; d.material.color.setRGB(0.4 + 0.6 * (1 - t), 0.6 + 0.2 * t, 1 - 0.7 * (1 - t) * 0.0); }); lake.visible = true; lake.position.y = -6.5; lake.material.color.setRGB(Math.min(1, 0.2 + (7 - pH) * 0.12), 0.65, Math.max(0.2, 0.95 - (7 - pH) * 0.1)); earth.visible = false; atmo.visible = false; earth.parent.children[1].visible = false;
        lab[0].pos(0, 11.5, 0).set('SO₂ = ' + fmt(S.so2, 0) + ' ppb → pH de la lluvia = ' + fmt(pH, 2), pH < 5.6 ? 'bl-neg' : 'bl-pos').vis(true); lab[1].pos(0, -10, 0).set('SO₂ + ½O₂ + H₂O → H₂SO₄ (pH normal ≈ 5,6)', 'bl-d').vis(true);
      } else {
        var r2 = RX[S.rx], ae = r2.ae / 100, y = S.y / 100, prod = 1, wasteS = (1 / (ae * y) - 1), solvent = S.solv, E = wasteS + solvent; var sc = Math.min(1, 12 / (1 + E)) * 1.0; var tot = prod + wasteS + solvent; var mx = Math.max(tot, 1), hS = 10 / Math.max(mx, 4);
        var hs = [prod * hS, Math.max(0.05, wasteS * hS), Math.max(0.05, solvent * hS)], cum = 0, cols = [0x4dabf7, 0xfa5252, 0xfab005], nm = ['producto', 'residuo de la reacción', 'disolvente'];
        hs.forEach(function (h, j) { var b = bars[j]; b.visible = true; b.scale.y = Math.max(0.05, h); b.position.set(-3 + 0, -8 + cum + h / 2, 0); b.scale.x = b.scale.z = 1.4; cum += h; b.position.x = 0; lab[1 + j].pos(3.4, -8 + cum - h / 2, 0).set(nm[j] + ': ' + fmt(j === 0 ? prod : (j === 1 ? wasteS : solvent), 2) + ' kg', 'bl-d').vis(h > 0.2); });
        lab[0].pos(0, 8, 0).set(r2.n + ' · AE = ' + fmt(r2.ae, 1) + ' % · E = ' + fmt(E, 1), E < 5 ? 'bl-pos' : 'bl-neg').vis(true); lab[4].pos(0, -9.4, 0).set('por cada kg de producto', 'bl-d').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cl) u.cl.set(S.cl); if (u.co2) u.co2.set(S.co2); if (u.so2) u.so2.set(S.so2); if (u.rx) u.rx.set(S.rx); },
    hud: function () { if (S.mode === 'oz') return { eq: { chip: 'O₃', name: 'Capa de ozono', body: '<div class="eqline"><small>Ozono restante</small>' + fmt(ozone(), 0) + ' %</div><div class="eqline"><small>Cl estratosférico</small>' + fmt(S.cl * 3, 1) + ' ppb</div>' }, legend: [{ label: 'Esferas verdes', color: '#69db7c', text: 'moléculas de O₃' }] }; if (S.mode === 'gh') return { eq: { chip: 'CO₂', name: 'Efecto invernadero', body: '<div class="eqline"><small>CO₂</small>' + fmt(S.co2, 0) + ' ppm</div><div class="eqline"><small>ΔF</small>' + fmt(forcing(S.co2), 2) + ' W/m²</div><div class="eqline"><small>ΔT</small>+' + fmt(dT(S.co2), 1) + ' °C</div>' }, legend: [{ label: 'Rojo', color: '#ff6b6b', text: 'infrarrojo emitido' }, { label: 'Naranja', color: '#ffa94d', text: 'IR reemitido' }] }; if (S.mode === 'ac') return { eq: { chip: fmt(ph(), 1), name: 'Lluvia ácida', body: '<div class="eqline"><small>SO₂</small>' + fmt(S.so2, 0) + ' ppb</div><div class="eqline"><small>pH</small>' + fmt(ph(), 2) + '</div>' }, legend: [{ label: 'Gotas', color: '#74c0fc', text: 'más rojas = más ácidas' }] }; var r = RX[S.rx]; return { eq: { chip: fmt(r.ae, 0) + '%', name: r.n, body: '<div class="eqline"><small>Economía atómica</small>' + fmt(r.ae, 1) + ' %</div><div class="eqline"><small>Factor E</small>' + fmt(efac(), 1) + '</div><div class="eqline"><small>Sector típico</small>' + r.sector + '</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'producto' }, { label: 'Rojo', color: '#fa5252', text: 'residuo de reacción' }, { label: 'Amarillo', color: '#fab005', text: 'disolvente' }] }; },
    measures: function () { if (S.mode === 'oz') return [['Ozono restante', fmt(ozone(), 0) + ' %'], ['Cl estratosférico', fmt(S.cl * 3, 1) + ' ppb']]; if (S.mode === 'gh') return [['CO₂', fmt(S.co2, 0) + ' ppm'], ['ΔF', fmt(forcing(S.co2), 2) + ' W/m²'], ['ΔT (sensibilidad 0,8 K·m²/W)', '+' + fmt(dT(S.co2), 1) + ' °C']]; if (S.mode === 'ac') return [['SO₂', fmt(S.so2, 0) + ' ppb'], ['pH de la lluvia', fmt(ph(), 2)]]; var r = RX[S.rx]; return [['Ruta', r.n], ['Economía atómica', fmt(r.ae, 1) + ' %'], ['Rendimiento', S.y + ' %'], ['Disolvente', fmt(S.solv, 1) + ' kg/kg'], ['Factor E', fmt(efac(), 1)]]; },
    ideas: ['Un Cl· destruye ~10⁵ moléculas de O₃.', 'ΔF = 5,35·ln(C/C₀).', 'La lluvia normal tiene pH ≈ 5,6.', 'Química verde: AE alta, E bajo.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Tema'); el.appendChild(c);
      c.appendChild(kit.ui.options({ label: 'Escenario', cols: 2, value: S.mode, options: [{ v: 'oz', label: 'Ozono' }, { v: 'gh', label: 'Invernadero' }, { v: 'ac', label: 'Lluvia ácida' }, { v: 'gc', label: 'Química verde' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }));
      ui.cl = kit.ui.slider({ label: 'Cloro estratosférico (CFC)', min: 0, max: 1, step: 0.01, value: S.cl, format: function (v) { return fmt(v * 3, 1) + ' ppb'; }, onInput: function (v) { ctx.goManual(); S.mode = 'oz'; S.cl = v; } });
      ui.co2 = kit.ui.slider({ label: 'CO₂ atmosférico', min: 280, max: 900, step: 5, value: S.co2, format: function (v) { return v + ' ppm'; }, onInput: function (v) { ctx.goManual(); S.mode = 'gh'; S.co2 = v; } });
      ui.so2 = kit.ui.slider({ label: 'SO₂ en el aire', min: 0, max: 100, step: 1, value: S.so2, format: function (v) { return v + ' ppb'; }, onInput: function (v) { ctx.goManual(); S.mode = 'ac'; S.so2 = v; } });
      c.appendChild(kit.ui.sliders([ui.cl, ui.co2, ui.so2]));
      var d = kit.ui.card('Química verde'); el.appendChild(d); ui.rx = kit.ui.options({ label: 'Ruta sintética', cols: 1, value: S.rx, options: RX.map(function (r, j) { return { v: j, label: r.n, sub: 'AE ' + r.ae + ' %' }; }), onChange: function (v) { ctx.goManual(); S.mode = 'gc'; S.rx = +v; } }); d.appendChild(ui.rx);
      var sy = kit.ui.slider({ label: 'Rendimiento', min: 30, max: 100, step: 1, value: S.y, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.mode = 'gc'; S.y = v; } });
      var ss = kit.ui.slider({ label: 'Disolvente (kg / kg producto)', min: 0, max: 30, step: 0.5, value: S.solv, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.mode = 'gc'; S.solv = v; } });
      d.appendChild(kit.ui.sliders([sy, ss])); d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Forzamiento radiativo del CO₂', h: 220, note: 'ΔF = 5,35·ln(C/280). El punto marca tu valor.', draw: function (cx, w, h, col) {
        var L = 40, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 300; i <= 900; i += 200) cx.fillText(i, L + pw * (i - 280) / 620, h - B + 14); cx.fillText('CO₂ (ppm)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 6; i += 2) cx.fillText(i, L - 4, Tp + ph * (1 - i / 7) + 3);
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 280; i <= 900; i += 10) { (i > 280 ? cx.lineTo : cx.moveTo).call(cx, L + pw * (i - 280) / 620, Tp + ph * (1 - forcing(i) / 7)); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * (S.co2 - 280) / 620, Tp + ph * (1 - forcing(S.co2) / 7), 5, 0, 6.28); cx.fill();
      } },
      { title: 'pH de la lluvia frente al SO₂', h: 210, note: 'Línea: pH 5,6 (lluvia limpia).', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph2 = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 100; i += 20) cx.fillText(i, L + pw * i / 100, h - B + 14); cx.fillText('SO₂ (ppb)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 3; i <= 6; i++) cx.fillText(i, L - 4, Tp + ph2 * (1 - (i - 3) / 3.2) + 3);
        var s0 = S.so2; S.so2 = 0; S.so2 = s0; cx.strokeStyle = '#fa5252'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 100; i += 2) { var p = -Math.log10(Math.pow(10, -5.6) + 2.4e-6 * i); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * i / 100, Tp + ph2 * (1 - (p - 3) / 3.2)); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * S.so2 / 100, Tp + ph2 * (1 - (ph() - 3) / 3.2), 5, 0, 6.28); cx.fill(); cx.strokeStyle = '#69db7c'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L, Tp + ph2 * (1 - 2.6 / 3.2)); cx.lineTo(L + pw, Tp + ph2 * (1 - 2.6 / 3.2)); cx.stroke(); cx.setLineDash([]);
      } },
      { title: 'Economía atómica de distintas rutas', h: 250, note: 'Resaltada: la ruta elegida.', draw: function (cx, w, h, col) {
        var L = 100, Rr = 36, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / RX.length; cx.font = '9.5px system-ui'; RX.forEach(function (r, j) { var y = Tp + j * bh; cx.fillStyle = j === S.rx ? '#ffa94d' : (r.ae > 70 ? '#69db7c' : '#fa5252'); cx.fillRect(L, y + 4, pw * r.ae / 100, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(r.n.length > 24 ? r.n.slice(0, 22) + '…' : r.n, L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(r.ae, 0) + ' %', L + pw * r.ae / 100 + 4, y + bh / 2 + 3); });
      } },
      { title: 'Factor E por sector industrial (kg residuo/kg producto)', h: 190, note: 'Valores típicos de Sheldon (escala logarítmica).', draw: function (cx, w, h, col) {
        var L = 90, Rr = 34, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / SEC.length; cx.font = '10px system-ui'; SEC.forEach(function (s, j) { var y = Tp + j * bh, v = Math.log10(s[1] * 100) / Math.log10(10000); cx.fillStyle = '#845ef7'; cx.fillRect(L, y + 5, pw * v, bh - 10); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(s[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText('≈ ' + (s[1] < 1 ? '< 0,1' : (s[1] < 5 ? '1–5' : (s[1] < 30 ? '5–50' : '25–100+'))), L + pw * v + 4, y + bh / 2 + 3); });
      } }
    ],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.mode === 'oz') return '<div class="card-kicker">Ciclo catalítico del cloro</div><table class="calc-table">' + row('Paso 1', 'Cl· + O₃ → ClO· + O₂') + row('Paso 2', 'ClO· + O → Cl· + O₂') + row('Neto', 'O₃ + O → 2 O₂') + row('Ozono restante', fmt(ozone(), 0) + ' %') + '</table>'; if (S.mode === 'gh') return '<div class="card-kicker">Forzamiento radiativo</div><table class="calc-table">' + row('ΔF = 5,35·ln(C/C₀)', '5,35 × ln(' + S.co2 + '/280) = <b>' + fmt(forcing(S.co2), 2) + ' W/m²</b>') + row('ΔT ≈ λ·ΔF', '0,8 × ' + fmt(forcing(S.co2), 2) + ' = <b>+' + fmt(dT(S.co2), 1) + ' °C</b>') + row('Duplicación (560 ppm)', '+' + fmt(forcing(560), 2) + ' W/m²') + '</table>'; if (S.mode === 'ac') return '<div class="card-kicker">pH de la lluvia</div><table class="calc-table">' + row('[H⁺] base (CO₂)', '2,5 × 10⁻⁶ M (pH 5,6)') + row('[H⁺] por SO₂', '2 × [H₂SO₄] ≈ ' + (2.4e-6 * S.so2).toExponential(1) + ' M') + row('pH', '<b>' + fmt(ph(), 2) + '</b>') + '</table>'; var r = RX[S.rx]; return '<div class="card-kicker">' + r.n + '</div><table class="calc-table">' + (r.mw.length ? row('Σ M reactivos', r.mw.map(function (m) { return fmt(m, 2); }).join(' + ') + ' = ' + fmt(r.mw.reduce(function (a, b) { return a + b; }, 0), 2)) + row('M producto', fmt(r.mp, 2)) : '') + row('Economía atómica', '<b>' + fmt(r.ae, 1) + ' %</b>') + row('Rendimiento', S.y + ' %') + row('Residuo de reacción', fmt(1 / (r.ae / 100 * S.y / 100) - 1, 2) + ' kg/kg') + row('Disolvente', fmt(S.solv, 1) + ' kg/kg') + row('Factor E', '<b>' + fmt(efac(), 1) + '</b>') + '</table><p class="muted small">' + r.note + '</p>'; },
    quiz: [
      { q: 'La reacción de Diels–Alder tiene una economía atómica de…', options: ['100 %', '50 %', '25 %', '0 %'], answer: 0, why: 'Todos los átomos pasan al producto.' },
      { q: 'Los CFC destruyen el ozono porque liberan…', options: ['Cl· que actúa como catalizador', 'F⁻', 'CO₂', 'agua'], answer: 0, why: 'El Cl· se regenera.' },
      { q: 'La lluvia ácida se define por pH menor que…', options: ['5,6', '7', '4', '3'], answer: 0, why: 'El CO₂ disuelto la lleva a 5,6.' },
      { q: 'El factor E mide…', options: ['kg de residuo por kg de producto', 'el rendimiento', 'la energía', 'la toxicidad'], answer: 0, why: 'Indicador de Sheldon.' },
      { q: 'El principal gas de la lluvia ácida sulfúrica es…', options: ['SO₂', 'CH₄', 'N₂', 'O₃'], answer: 0, why: 'Se oxida a H₂SO₄.' },
      { q: 'Un incremento de CO₂ de 280 a 560 ppm produce un ΔF de…', options: ['≈ 3,7 W/m²', '≈ 1 W/m²', '≈ 10 W/m²', '0'], answer: 0, why: '5,35·ln2.' }
    ],
    help: { intro: 'Cuatro escenarios: ozono, invernadero, lluvia ácida y química verde. Cambia los controles (cloro, CO₂, SO₂, ruta sintética) y observa los números del panel.', items: [['«Escenario»', 'cambia entre Ozono, Invernadero, Lluvia ácida y Química verde; cada uno tiene su propio control.'], ['Ozono', 'esferas verdes = O₃; «Cloro estratosférico (CFC)» las destruye catalíticamente.'], ['Invernadero y lluvia ácida', 'rayos rojos y naranjas = infrarrojo emitido y reemitido según el «CO₂ atmosférico»; las gotas más rojas son más ácidas según el «SO₂ en el aire».'], ['Química verde', '«Ruta sintética», «Rendimiento» y «Disolvente» separan producto, residuo y disolvente; el panel calcula la economía atómica y el factor E.'], ['Gráficos', 'forzamiento radiativo del CO₂, pH de la lluvia frente al SO₂, economía atómica de las rutas y factor E por sector.']], try: ['Duplica el CO₂: el forzamiento sube ≈ 3,7 W/m² (ΔF = 5,35·ln 2).', 'Lleva el SO₂ a cero: la lluvia queda en pH ≈ 5,6, no en 7.', 'Compara dos rutas sintéticas: la de mayor economía atómica genera menos residuo.'] }
  };
  MSim.create(def);
})();
