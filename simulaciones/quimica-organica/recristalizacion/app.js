/* Recristalización — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CM = { ba: { n: 'Ácido benzoico / agua', s: 'agua', a: Math.log(0.17), b: 0.0355, Tb: 100, c: 0xffffff }, ac: { n: 'Acetanilida / agua', s: 'agua', a: Math.log(0.46) - 20 * 0.031, b: 0.031, Tb: 100, c: 0xf8f9fa }, na: { n: 'Naftaleno / etanol', s: 'etanol', a: Math.log(7) - 20 * 0.037, b: 0.037, Tb: 78, c: 0xe9ecef } };
  var S = { cm: 'ba', m: 2, ex: 10, Tf: 0, slow: true, p: 0 }, lab = [], g = null, liq = null, cry = [], steam = [];
  function sol(k, t) { var c = CM[k]; return Math.exp(c.a + c.b * t); }
  function calc() { var c = CM[S.cm], Vmin = S.m / sol(S.cm, c.Tb) * 100, V = Vmin * (1 + S.ex / 100), rec = Math.max(0, S.m - sol(S.cm, S.Tf) * V / 100); return { Vmin: Vmin, V: V, rec: rec, pct: rec / S.m * 100 }; }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.3, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Idea de la recristalización', 'Fundamentos', 'Un sólido impuro se disuelve en caliente y cristaliza puro al enfriar',
        '<p>La <b>recristalización</b> purifica sólidos aprovechando que la solubilidad <b>aumenta con la temperatura</b>. Se disuelve el sólido impuro en la <b>mínima cantidad de disolvente caliente</b>; al enfriar, el compuesto principal cristaliza (su solubilidad cae) y las <b>impurezas</b>, presentes en poca cantidad, quedan en el <b>licor madre</b>.</p>'],
      ['El disolvente ideal', 'Disolvente', 'Poco soluble en frío, muy soluble en caliente, no reacciona y es volátil',
        '<p>El buen disolvente disuelve el compuesto <b>en caliente (cerca del punto de ebullición) pero casi nada en frío</b>, no reacciona con él, tiene un punto de ebullición menor que el punto de fusión del soluto y es fácil de eliminar. Compara las curvas de solubilidad S(T) de los tres sistemas.</p>'],
      ['Volumen mínimo de disolvente', 'Volumen', 'Un exceso de disolvente reduce el rendimiento',
        '<p>Se añade disolvente caliente <b>poco a poco</b> hasta disolver justo todo el sólido: <b>V<sub>mín</sub> = m / S(T<sub>eb</sub>)</b>. Un exceso de disolvente deja más soluto disuelto en frío y <b>baja el rendimiento</b>; muy poco no disuelve todo. Un exceso de 5–10 % evita que cristalice en el embudo durante la filtración en caliente.</p>'],
      ['Enfriamiento y cristalización', 'Cristales', 'Enfriar lento da cristales grandes y puros; enfriar rápido atrapa impurezas',
        '<p>Se deja enfriar <b>lentamente</b> a temperatura ambiente y luego en baño de hielo. El enfriamiento lento favorece <b>cristales grandes y puros</b>; el rápido produce un polvo fino que <b>ocluye impurezas</b>. Si no cristaliza, se <b>raya</b> la pared o se añade un <b>cristal de siembra</b>. Se filtra al vacío (Büchner) y se lava con disolvente frío.</p>'],
      ['Rendimiento', 'Rendimiento', 'Recuperado = m − S(T final)·V',
        '<p>El sólido recuperado es <b>m − S(T<sub>final</sub>)·V</b>: lo que queda disuelto en el licor madre se pierde. El rendimiento sube al enfriar más (0 °C), al usar menos exceso de disolvente y con un disolvente de curva más pronunciada. Nunca es del 100 %: es el precio de la pureza.</p>']
    ];
  }
  var def = {
    key: 'recristalizacion', title: 'Recristalización', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#3bc9db', light: '#0c8599' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [5, 5, 18], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 2, 20], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 20, 3], target: [0, 0, 0] }],
    layers: [{ id: 'cri', label: 'Cristales', icon: '◆' }, { id: 'vap', label: 'Vapor', icon: '~' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var glass = mat(0xa5d8ff, 0.22), i;
      var fl = new T.Mesh(new T.CylinderGeometry(1.4, 5, 8, 32, 1, true), glass); fl.position.y = 0; g.add(fl); var nk = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 4, 24, 1, true), glass); nk.position.y = 6; g.add(nk);
      liq = new T.Mesh(new T.CylinderGeometry(3.6, 4.8, 4.6, 32), mat(0xc5f6fa, 0.5)); liq.position.y = -1.7; g.add(liq);
      var hp = new T.Mesh(new T.CylinderGeometry(6, 6, 0.6, 24), mat(0x495057, 1)); hp.position.y = -4.4; g.add(hp);
      for (i = 0; i < 90; i++) { var c = new T.Mesh(new T.OctahedronGeometry(0.2), mat(0xffffff, 1)); c.userData = { a: Math.random() * 6.28, r: Math.random(), ph: Math.random() }; g.add(c); cry.push(c); }
      for (i = 0; i < 12; i++) { var s = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), mat(0xffffff, 0.5)); s.userData.ph = Math.random(); g.add(s); steam.push(s); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, c = CM[S.cm], cc;
      if (!P.manual) { var i = f.i; if (i === 1) S.cm = ['ba', 'ac', 'na'][Math.min(2, Math.floor(f.local * 3))]; S.p = i === 0 ? 0 : (i === 3 || i === 4 ? Math.min(1, f.local * 1.1) : (i === 2 ? 0 : 0)); if (i === 2) S.ex = 5 + f.local * 80; if (i >= 3) S.ex = 10; }
      cc = calc(); var T0 = c.Tb, Tn = T0 + (S.Tf - T0) * (S.slow ? S.p : Math.min(1, S.p * 1.0)), hot = 1 - S.p, nCr = Math.round(90 * Math.min(1, cc.pct / 100) * Math.max(0, (S.p - 0.15) / 0.85)), cOn = ctx.layer('cri'), vOn = ctx.layer('vap');
      liq.material.color.setRGB(0.77 + 0.2 * hot, 0.96 - 0.1 * hot, 0.98 - 0.1 * hot); liq.scale.set(1, Math.min(1.5, 0.6 + (cc.V / (cc.Vmin * 1.2)) * 0.4), 1); liq.position.y = -4 + liq.scale.y * 2.3;
      cry.forEach(function (m, j) { m.visible = cOn && j < nCr; var sz = S.slow ? 1.6 : 0.6; m.scale.setScalar(sz); var r = 4.2 * Math.sqrt(m.userData.r) * (0.4 + 0.6 * (-3.8 / -4)); m.position.set(Math.cos(m.userData.a) * Math.min(4, r), -4 + 0.3 + (S.slow ? 0.2 : 0) * (j % 3), Math.sin(m.userData.a) * Math.min(4, r)); m.rotation.set(now * 0.1 + j, j, 0); });
      steam.forEach(function (s, j) { var u = (now * 0.4 + s.userData.ph) % 1; s.position.set(Math.sin(j + now) * 0.5, 4.5 + u * 5, Math.cos(j) * 0.5); s.visible = vOn && hot > 0.5; s.material.opacity = 0.5 * (1 - u); });
      lab[0].pos(0, 11, 0).set(c.n, 'bl-lead').vis(true); lab[1].pos(8, -1, 0).set('T = ' + fmt(Tn, 0) + ' °C', 'bl-d').vis(true);
      lab[2].pos(0, -6.5, 0).set('V = ' + fmt(cc.V, 0) + ' mL (mín. ' + fmt(cc.Vmin, 0) + ' mL)', 'bl-d').vis(true); lab[3].pos(0, -7.5, 0).set('Rendimiento ' + fmt(cc.pct, 0) + ' %', cc.pct > 70 ? 'bl-pos' : 'bl-neg').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cm) u.cm.set(S.cm); if (u.m) u.m.set(S.m); if (u.ex) u.ex.set(S.ex); if (u.Tf) u.Tf.set(S.Tf); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var c = CM[S.cm], cc = calc(); return { eq: { chip: fmt(cc.pct, 0) + '%', name: c.n, body: '<div class="eqline"><small>V mínimo</small>' + fmt(cc.Vmin, 1) + ' mL</div><div class="eqline"><small>V usado</small>' + fmt(cc.V, 1) + ' mL</div><div class="eqline"><small>Recuperado</small>' + fmt(cc.rec, 2) + ' g de ' + fmt(S.m, 1) + ' g</div><div class="eqline"><small>Cristales</small>' + (S.slow ? 'grandes y puros' : 'finos, con impurezas') + '</div>' }, legend: [{ label: 'Octaedros', color: '#e9ecef', text: 'cristales del compuesto' }, { label: 'Líquido', color: '#c5f6fa', text: 'disolución (licor madre)' }] }; },
    measures: function () { var c = CM[S.cm], cc = calc(); return [['Sistema', c.n], ['Masa', fmt(S.m, 1) + ' g'], ['S a ' + c.Tb + ' °C', fmt(sol(S.cm, c.Tb), 2) + ' g/100 mL'], ['S a ' + S.Tf + ' °C', fmt(sol(S.cm, S.Tf), 2) + ' g/100 mL'], ['V mínimo', fmt(cc.Vmin, 1) + ' mL'], ['Rendimiento', fmt(cc.pct, 1) + ' %']]; },
    ideas: ['Disolvente: soluble en caliente, insoluble en frío.', 'Poco exceso de disolvente → más rendimiento.', 'Enfriar lento → cristales grandes y puros.', 'Los valores de solubilidad son aproximados (didácticos).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experimento'); el.appendChild(c);
      ui.cm = kit.ui.options({ label: 'Compuesto / disolvente', cols: 1, value: S.cm, options: Object.keys(CM).map(function (k) { return { v: k, label: CM[k].n }; }), onChange: function (v) { ctx.goManual(); S.cm = v; } }); c.appendChild(ui.cm);
      ui.m = kit.ui.slider({ label: 'Masa de sólido', min: 0.5, max: 5, step: 0.1, value: S.m, format: function (v) { return fmt(v, 1) + ' g'; }, onInput: function (v) { ctx.goManual(); S.m = v; } });
      ui.ex = kit.ui.slider({ label: 'Exceso de disolvente', min: 0, max: 100, step: 5, value: S.ex, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.ex = v; } });
      ui.Tf = kit.ui.slider({ label: 'Temperatura final', min: 0, max: 40, step: 1, value: S.Tf, format: function (v) { return v + ' °C'; }, onInput: function (v) { ctx.goManual(); S.Tf = v; } });
      ui.p = kit.ui.slider({ label: 'Enfriamiento', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } });
      c.appendChild(kit.ui.sliders([ui.m, ui.ex, ui.Tf, ui.p]));
      c.appendChild(kit.ui.options({ label: 'Velocidad de enfriamiento', cols: 2, value: S.slow ? 's' : 'f', options: [{ v: 's', label: 'Lento' }, { v: 'f', label: 'Rápido' }], onChange: function (v) { ctx.goManual(); S.slow = v === 's'; } }));
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Curvas de solubilidad', h: 250, note: 'g de soluto / 100 mL de disolvente (valores aproximados). Los puntos marcan T de ebullición y T final.', draw: function (cx, w, h, col) {
      var L = 40, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, ks = ['ba', 'ac', 'na'], cols = ['#fa5252', '#4dabf7', '#40c057'], mx = 62; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 100; i += 20) cx.fillText(i, L + pw * i / 100, h - B + 14); cx.fillText('T (°C)', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 60; i += 20) cx.fillText(i, L - 4, Tp + ph * (1 - i / mx) + 3);
      ks.forEach(function (k, j) { cx.strokeStyle = cols[j]; cx.lineWidth = k === S.cm ? 3 : 1.5; cx.beginPath(); for (i = 0; i <= 100; i++) { var s = Math.min(mx, sol(k, i)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * i / 100, Tp + ph * (1 - s / mx)); } cx.stroke(); });
      var c = CM[S.cm]; [[c.Tb], [S.Tf]].forEach(function (a) { cx.fillStyle = col.ink; cx.beginPath(); cx.arc(L + pw * a[0] / 100, Tp + ph * (1 - Math.min(mx, sol(S.cm, a[0])) / mx), 4, 0, 6.28); cx.fill(); }); cx.lineWidth = 1;
    } }],
    calc: function () { var c = CM[S.cm], cc = calc(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('S(' + c.Tb + ' °C)', fmt(sol(S.cm, c.Tb), 2) + ' g/100 mL') + row('V<sub>mín</sub> = m/S·100', fmt(S.m, 1) + ' / ' + fmt(sol(S.cm, c.Tb), 2) + ' × 100 = <b>' + fmt(cc.Vmin, 1) + ' mL</b>') + row('V usado', fmt(cc.V, 1) + ' mL (+' + S.ex + ' %)') + row('Disuelto a ' + S.Tf + ' °C', fmt(sol(S.cm, S.Tf) * cc.V / 100, 2) + ' g') + row('Recuperado', '<b>' + fmt(cc.rec, 2) + ' g (' + fmt(cc.pct, 1) + ' %)</b>') + '</table>'; },
    quiz: [
      { q: 'El disolvente ideal para recristalizar es…', options: ['soluble en caliente e insoluble en frío', 'soluble siempre', 'insoluble siempre', 'muy viscoso'], answer: 0, why: 'Así se recupera casi todo al enfriar.' },
      { q: 'Un exceso de disolvente…', options: ['reduce el rendimiento', 'aumenta la pureza siempre', 'no cambia nada', 'aumenta la T de ebullición'], answer: 0, why: 'Más soluto queda disuelto en frío.' },
      { q: 'Para cristales grandes y puros conviene…', options: ['enfriar lentamente', 'enfriar de golpe', 'agitar fuerte', 'añadir más soluto'], answer: 0, why: 'El enfriamiento rápido ocluye impurezas.' },
      { q: 'Si no aparecen cristales, puedes…', options: ['rayar la pared o sembrar', 'calentar más', 'añadir agua caliente', 'filtrar'], answer: 0, why: 'Se favorece la nucleación.' },
      { q: 'El licor madre contiene…', options: ['soluto disuelto e impurezas solubles', 'sólo el compuesto', 'sólo disolvente puro', 'cristales'], answer: 0, why: 'Es la disolución tras filtrar.' }
    ],
    help: { intro: 'Escoge el sistema y ajusta la masa, el exceso de disolvente y la temperatura final; mueve «Enfriamiento» para ver formarse los cristales.', items: [['Matraz', 'octaedros = cristales formados; líquido = licor madre, con el soluto que queda disuelto y las impurezas solubles.'], ['Controles', '«Compuesto / disolvente», «Masa de sólido», «Exceso de disolvente», «Temperatura final», «Enfriamiento» y «Velocidad de enfriamiento» (lento o rápido).'], ['Gráfico', '«Curvas de solubilidad» (valores aproximados, con fines didácticos).']], try: ['Aumenta el exceso de disolvente: el rendimiento baja.', 'Enfría rápido y luego lento: compara el tamaño de los cristales.', 'Baja la temperatura final: cristaliza más producto.'] }
  };
  MSim.create(def);
})();
