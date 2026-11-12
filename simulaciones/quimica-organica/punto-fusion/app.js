/* Punto de fusión y pureza — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, R = 8.314;
  var CM = { ba: { n: 'Ácido benzoico', Tm: 122.4, H: 18000, c: 0xf8f9fa }, ur: { n: 'Urea', Tm: 133, H: 14000, c: 0xe9ecef }, na: { n: 'Naftaleno', Tm: 80.3, H: 19100, c: 0xdee2e6 }, ac: { n: 'Acetanilida', Tm: 114.3, H: 21600, c: 0xf1f3f5 }, sa: { n: 'Ácido salicílico', Tm: 159, H: 25000, c: 0xe9ecef } };
  var S = { cm: 'ba', xi: 0, rate: 2, T: 25, run: false, mix: 'none', obs: null }, lab = [], g = null, cap = null, sol = null, liqm = null, tube = null;
  function ints(k, xi) { var c = CM[k], Tm = c.Tm + 273.15, dT = R * Tm * Tm / c.H * xi, Te = c.Tm - 35, liq = Math.max(Te + 1, c.Tm - dT); return { onset: xi > 0.001 ? Math.max(Te, c.Tm - Math.min(35, 4 + 90 * xi)) : c.Tm - 0.3, clear: xi > 0.001 ? liq : c.Tm + 0.3 }; }
  function range() { var i = ints(S.cm, S.xi), lag = 0.9 * S.rate; return { on: i.onset, cl: i.clear, onM: i.onset + lag * 0.5, clM: i.clear + lag }; }
  function frac(Tt) { var r = range(); return Math.max(0, Math.min(1, (Tt - r.onM) / Math.max(0.2, r.clM - r.onM))); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.4, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Qué mide el punto de fusión', 'Fundamentos', 'Temperatura a la que un sólido cristalino pasa a líquido; es un criterio de identidad y pureza',
        '<p>El <b>punto de fusión</b> es la temperatura en que coexisten sólido y líquido. Un compuesto <b>puro</b> funde en un <b>rango estrecho</b> (0,5–1 °C). Se mide en un tubo <b>capilar</b> con unos pocos milímetros de muestra, dentro de un bloque calefactor con termómetro. Se anotan dos valores: <b>inicio</b> (primera gota) y <b>final</b> (todo líquido).</p>'],
      ['Impurezas: depresión y ensanchamiento', 'Pureza', 'Una impureza baja y ensancha el rango de fusión',
        '<p>Una impureza soluble en el líquido <b>disminuye el punto de fusión</b> (depresión del punto de congelación): ΔT ≈ R·T<sub>m</sub>²·x<sub>imp</sub>/ΔH<sub>fus</sub>. El sólido empieza a fundir a una temperatura cercana al <b>eutéctico</b> y termina más abajo que el puro: el rango se <b>ensancha</b>. Por eso un rango amplio indica una muestra impura.</p>'],
      ['Velocidad de calentamiento', 'Velocidad', 'Calentar rápido desplaza y ensancha el rango observado',
        '<p>La muestra y el termómetro no están en equilibrio si se calienta rápido: el valor observado queda <b>por encima</b> del real y el rango aparece más ancho. Lo recomendable es acercarse rápidamente a ~15 °C del valor esperado y luego calentar a <b>1–2 °C/min</b>. Usa el control de velocidad y compara.</p>'],
      ['Punto de fusión mixto', 'Mixto', 'Si la mezcla con un patrón no baja el punto, ambos son el mismo compuesto',
        '<p>Para identificar un desconocido se mezcla con un <b>patrón</b> y se mide el <b>punto de fusión mixto</b>. Si son el mismo compuesto, el punto de fusión <b>no cambia</b>; si son distintos, la mezcla <b>funde más bajo y en un rango amplio</b>. Activa «Mezcla con otro compuesto» para simularlo.</p>'],
      ['Diagrama sólido–líquido', 'Diagrama', 'Eutéctico: la mezcla de menor punto de fusión',
        '<p>El diagrama T–x muestra la curva <b>liquidus</b> (por encima todo es líquido) y la <b>solidus</b> o línea eutéctica (por debajo todo es sólido). Entre ambas coexisten sólido y líquido. El rango observado corresponde a la distancia vertical entre ambas curvas para la composición de la muestra.</p>']
    ];
  }
  var def = {
    key: 'punto-fusion', title: 'Punto de fusión y pureza', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [4, 3, 16], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 18], target: [0, 0, 0] }],
    layers: [{ id: 'cap', label: 'Zoom al capilar', icon: '🔍' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g);
      var blk = new T.Mesh(new T.BoxGeometry(8, 9, 5), mat(0x868e96, 1)); blk.position.set(-3, 0, -1); g.add(blk);
      var win = new T.Mesh(new T.BoxGeometry(5, 5, 0.2), mat(0xa5d8ff, 0.3)); win.position.set(-3, 0, 1.55); g.add(win);
      tube = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 10, 12, 1, true), mat(0xdee2e6, 0.4)); tube.position.set(-3, 0, 1.2); g.add(tube);
      sol = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 1, 12), mat(0xf8f9fa, 1)); sol.position.set(-3, -2, 1.2); g.add(sol);
      liqm = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 1, 12), mat(0xffd8a8, 0.6)); liqm.position.set(-3, -2, 1.2); g.add(liqm);
      var th = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 14, 10), mat(0xe03131, 0.8)); th.position.set(-1.5, 2, 1.2); g.add(th);
      cap = new T.Group(); cap.position.set(7, 0, 0); g.add(cap);
      for (var i = 0; i < 36; i++) { var cr = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), mat(0xf8f9fa, 1)); cr.userData = { a: Math.random() * 6.28, r: Math.random(), y: Math.random() }; cap.add(cr); }
      var gl = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 7, 20, 1, true), mat(0xdee2e6, 0.25)); cap.add(gl);
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, c = CM[S.cm], r;
      if (!P.manual) { var i = f.i; S.xi = i === 0 ? 0 : (i === 1 ? 0.12 * f.local : (i === 3 ? 0.2 : (i === 4 ? 0.1 : 0))); S.rate = i === 2 ? 1 + 9 * f.local : 2; S.mix = i === 3 ? 'diff' : 'none'; S.T = 20 + (c.Tm + 15 - 20) * Math.min(1, f.local * 1.05); }
      else if (S.run) { S.T += S.rate / 60 * dt * 20; if (S.T > c.Tm + 20) { S.T = c.Tm + 20; S.run = false; } }
      var xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi; var save = S.xi; S.xi = xe; r = range(); var fr = frac(S.T); S.xi = save;
      sol.scale.y = 1.5 + 1.5 * (1 - fr); sol.position.y = -4.5 + sol.scale.y / 2; liqm.scale.y = 1.5 * fr + 0.01; liqm.position.y = -4.5 + sol.scale.y + liqm.scale.y / 2 - 0.5; liqm.visible = fr > 0.01; sol.visible = fr < 0.999;
      cap.children.forEach(function (m, j) { if (j >= 36) return; var u = m.userData; m.visible = ctx.layer('cap') && (j / 36) > fr; m.position.set(Math.cos(u.a) * u.r * 1.5, -3 + u.y * 5.5 * (1 - 0.3 * fr), Math.sin(u.a) * u.r * 1.5); m.material.color.setHex(0xf8f9fa); });
      cap.visible = ctx.layer('cap'); cap.rotation.y = now * 0.3;
      var a = ints(S.cm, xe);
      lab[0].pos(-3, 7, 0).set(c.n + (S.mix === 'diff' ? ' + otro compuesto' : ''), 'bl-lead').vis(true);
      lab[1].pos(-3, -6.5, 0).set('T = ' + fmt(S.T, 1) + ' °C · ' + (fr <= 0 ? 'sólido' : (fr >= 1 ? 'líquido' : 'fundiendo ' + fmt(fr * 100, 0) + ' %')), fr > 0 && fr < 1 ? 'bl-pos' : 'bl-d').vis(true);
      lab[2].pos(-3, -7.5, 0).set('Rango: ' + fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C (Δ ' + fmt(a.clear - a.onset, 1) + ')', 'bl-d').vis(true); lab[3].vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cm) u.cm.set(S.cm); if (u.xi) u.xi.set(S.xi); if (u.rate) u.rate.set(S.rate); if (u.T) u.T.set(S.T); },
    hud: function () { var c = CM[S.cm], xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi, a = ints(S.cm, xe), pure = a.clear - a.onset < 2; return { eq: { chip: fmt(a.clear - a.onset, 1), name: c.n, body: '<div class="eqline"><small>Inicio</small>' + fmt(a.onset, 1) + ' °C</div><div class="eqline"><small>Final</small>' + fmt(a.clear, 1) + ' °C</div><div class="eqline"><small>Valor tabulado</small>' + fmt(c.Tm, 1) + ' °C</div><div class="eqline"><small>Pureza</small>' + (pure ? 'rango estrecho: puro' : 'rango amplio: impuro') + '</div>' }, legend: [{ label: 'Cristales blancos', color: '#f8f9fa', text: 'sólido' }, { label: 'Líquido naranja', color: '#ffd8a8', text: 'fundido' }] }; },
    measures: function () { var c = CM[S.cm], xe = S.mix === 'diff' ? Math.max(S.xi, 0.25) : S.xi, a = ints(S.cm, xe), r = range(); return [['Compuesto', c.n], ['Tabulado', fmt(c.Tm, 1) + ' °C'], ['Impureza', fmt(xe * 100, 0) + ' %'], ['Rango real', fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C'], ['Velocidad', fmt(S.rate, 1) + ' °C/min'], ['Observado (con retraso)', fmt(r.onM, 1) + ' – ' + fmt(r.clM, 1) + ' °C']]; },
    ideas: ['Puro: rango ≤ 1 °C y cercano al tabulado.', 'Impureza: baja y ensancha el rango.', 'Calentar lento: 1–2 °C/min.', 'Mixto sin cambio → mismo compuesto.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra'); el.appendChild(c);
      ui.cm = kit.ui.options({ label: 'Compuesto', cols: 2, value: S.cm, options: Object.keys(CM).map(function (k) { return { v: k, label: CM[k].n, sub: CM[k].Tm + ' °C' }; }), onChange: function (v) { ctx.goManual(); S.cm = v; S.T = 25; } }); c.appendChild(ui.cm);
      ui.xi = kit.ui.slider({ label: 'Impureza (fracción molar)', min: 0, max: 0.3, step: 0.01, value: S.xi, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.xi = v; } });
      ui.rate = kit.ui.slider({ label: 'Velocidad de calentamiento', min: 0.5, max: 10, step: 0.5, value: S.rate, format: function (v) { return fmt(v, 1) + ' °C/min'; }, onInput: function (v) { ctx.goManual(); S.rate = v; } });
      ui.T = kit.ui.slider({ label: 'Temperatura del bloque', min: 20, max: 190, step: 0.5, value: S.T, format: function (v) { return fmt(v, 1) + ' °C'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.T = v; } });
      c.appendChild(kit.ui.sliders([ui.xi, ui.rate, ui.T]));
      c.appendChild(kit.ui.options({ label: 'Punto de fusión mixto', cols: 2, value: S.mix, options: [{ v: 'none', label: 'Sin mezcla' }, { v: 'diff', label: 'Mezcla con otro compuesto' }], onChange: function (v) { ctx.goManual(); S.mix = v; } }));
      c.appendChild(ctx.btnRow([{ t: '▶ Calentar', primary: true, fn: function () { ctx.goManual(); S.T = 25; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Diagrama sólido–líquido (T–x)', h: 250, note: 'Naranja: liquidus. Gris: solidus (eutéctico). El punto marca tu muestra.', draw: function (cx, w, h, col) {
      var c = CM[S.cm], L = 42, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, Tlo = c.Tm - 45, Thi = c.Tm + 6, i, sx = function (x) { return L + pw * x / 0.4; }, sy = function (t) { return Tp + ph * (1 - (t - Tlo) / (Thi - Tlo)); };
      cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i / 10, 1), sx(i / 10), h - B + 14); cx.fillText('fracción molar de impureza', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { var t = Tlo + (Thi - Tlo) * i / 4; cx.fillText(fmt(t, 0), L - 4, sy(t) + 3); }
      cx.lineWidth = 2; cx.strokeStyle = '#ff922b'; cx.beginPath(); for (i = 0; i <= 80; i++) { var x = 0.4 * i / 80, tt = ints(S.cm, x).clear; (i ? cx.lineTo : cx.moveTo).call(cx, sx(x), sy(tt)); } cx.stroke();
      cx.strokeStyle = '#868e96'; cx.beginPath(); for (i = 0; i <= 80; i++) { var x2 = 0.4 * i / 80, to = ints(S.cm, x2).onset; (i ? cx.lineTo : cx.moveTo).call(cx, sx(x2), sy(to)); } cx.stroke(); cx.lineWidth = 1;
      var a = ints(S.cm, S.xi); cx.fillStyle = col.ink; cx.beginPath(); cx.arc(sx(S.xi), sy(a.clear), 4, 0, 6.28); cx.fill(); cx.beginPath(); cx.arc(sx(S.xi), sy(a.onset), 4, 0, 6.28); cx.fill();
    } }],
    calc: function () { var c = CM[S.cm], Tm = c.Tm + 273.15, dT = R * Tm * Tm / c.H * S.xi, a = ints(S.cm, S.xi), row = function (a1, b) { return '<tr><th>' + a1 + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('T<sub>m</sub> tabulado', fmt(c.Tm, 1) + ' °C') + row('ΔH<sub>fus</sub>', fmt(c.H / 1000, 1) + ' kJ/mol') + row('ΔT = R·T<sub>m</sub>²·x/ΔH', '8,314 × ' + fmt(Tm, 1) + '² × ' + fmt(S.xi, 2) + ' / ' + fmt(c.H, 0) + ' = <b>' + fmt(dT, 1) + ' K</b>') + row('Rango', fmt(a.onset, 1) + ' – ' + fmt(a.clear, 1) + ' °C') + '</table><p class="muted small">Modelo didáctico: depresión ideal y solidus simplificada.</p>'; },
    quiz: [
      { q: 'Una muestra pura funde…', options: ['en un rango estrecho', 'en un rango amplio', 'a cualquier T', 'sin cambio'], answer: 0, why: 'Rango típico 0,5–1 °C.' },
      { q: 'Una impureza provoca…', options: ['baja y ensancha el rango', 'sube el punto de fusión', 'no cambia nada', 'sólo oscurece'], answer: 0, why: 'Depresión del punto de fusión.' },
      { q: 'Velocidad recomendada cerca del punto de fusión:', options: ['1–2 °C/min', '20 °C/min', '10 °C/s', 'sin calentar'], answer: 0, why: 'Para mantener el equilibrio térmico.' },
      { q: 'En un punto de fusión mixto, si el valor no cambia, entonces…', options: ['son el mismo compuesto', 'son distintos', 'está impuro', 'hay error'], answer: 0, why: 'La mezcla de distintos funde más bajo.' },
      { q: 'La temperatura eutéctica es…', options: ['la mínima de fusión de la mezcla', 'la máxima', 'el punto de ebullición', 'la T ambiente'], answer: 0, why: 'La línea solidus.' }
    ],
    help: { intro: 'Elige el compuesto, añade impureza y pulsa «Calentar» o arrastra la temperatura del bloque. El zoom muestra los cristales del capilar.', items: [['Aparato', 'el tubo es el capilar con la muestra; la capa «Zoom al capilar» amplía los cristales (blancos = sólido, naranja = fundido).'], ['Controles', '«Compuesto», «Impureza (fracción molar)», «Velocidad de calentamiento», «Temperatura del bloque» y «Punto de fusión mixto»; «▶ Calentar» lo anima.'], ['Rango', 'el panel registra la temperatura de inicio y de final de la fusión.'], ['Gráfico', '«Diagrama sólido–líquido (T–x)».']], try: ['Funde la muestra pura y luego con impureza: el punto baja y el rango se ensancha.', 'Calienta rápido: el rango medido sale desplazado; lo correcto es 1–2 °C/min.', 'Haz un punto de fusión mixto con otro compuesto: si baja, no son el mismo compuesto.'] }
  };
  MSim.create(def);
})();
