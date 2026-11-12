/* Síntesis de la aspirina — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, MS = 138.12, MA = 180.16, MAC = 102.09, DAC = 1.08;
  var S = { ms: 2.0, vac: 5.0, tc: 75, t: 15, cat: 1, mech: 0 }, g = null, gl = null, gr = null, lab = [], cr = [], tube = null, tubeLiq = null, keyM = -1;
  function ring(extra) { // geometría manual: anillo + sustituyentes (extra: 0 salicílico, 1 acetilsalicílico)
    var a = [], b = [], i;
    for (i = 0; i < 6; i++) { var ang = i * Math.PI / 3; a.push(['C', Math.cos(ang) * 1.4, Math.sin(ang) * 1.4, 0]); }
    for (i = 0; i < 6; i++) b.push([i, (i + 1) % 6, i % 2 ? 1 : 2]);
    function add(el, x, y) { a.push([el, x, y, 0]); return a.length - 1; }
    var c = add('C', 2.9, 0), o1 = add('O', 3.6, 1.1), o2 = add('O', 3.5, -1.1); b.push([0, c, 1], [c, o1, 2], [c, o2, 1]);
    var ox = add('O', 0.7 * 2.0 + 0.0, 1.0 * 2.5 + 0.1); a[ox] = ['O', 1.4 * Math.cos(Math.PI / 3) * 1.9, 1.4 * Math.sin(Math.PI / 3) * 1.9, 0]; b.push([1, ox, 1]);
    if (extra) { var ca = add('C', a[ox][1] + 0.9, a[ox][2] + 1.3), oa = add('O', a[ox][1] + 2.1, a[ox][2] + 1.1), me = add('C', a[ox][1] + 0.2, a[ox][2] + 2.7); b.push([ox, ca, 1], [ca, oa, 2], [ca, me, 1]); }
    else { var h = add('H', a[ox][1] + 0.5, a[ox][2] + 0.8); b.push([ox, h, 1]); }
    var hh = add('H', 3.8, -1.7); b.push([o2, hh, 1]);
    [2, 3, 4, 5].forEach(function (k) { var ang = k * Math.PI / 3, h2 = add('H', Math.cos(ang) * 2.5, Math.sin(ang) * 2.5); b.push([k, h2, 1]); });
    var cx = 0, cy = 0; a.forEach(function (x) { cx += x[1]; cy += x[2]; }); cx /= a.length; cy /= a.length; a.forEach(function (x) { x[1] -= cx; x[2] -= cy; });
    return { a: a, b: b };
  }
  function nS() { return S.ms / MS * 1000; }
  function nA() { return S.vac * DAC / MAC * 1000; }
  function lim() { return nS() <= nA() ? 'ácido salicílico' : 'anhídrido acético'; }
  function nTeor() { return Math.min(nS(), nA()); }
  function mTeor() { return nTeor() * MA / 1000; }
  function k() { var k75 = 0.25 * (S.cat ? 1 : 0.04), Ea = 60000, R = 8.314; return k75 * Math.exp(-Ea / R * (1 / (S.tc + 273.15) - 1 / 348.15)); }
  function conv() { return 1 - Math.exp(-k() * S.t); }
  function mReal() { return mTeor() * conv() * 0.85 * (S.tc > 90 ? 0.8 : 1); }
  function pct() { return mReal() / mTeor() * 100; }
  function purity() { var fr = 1 - conv(), imp = fr * 0.6; return 1 - imp / (1 + imp); }
  var MECH = ['Protonación del anhídrido', 'Ataque nucleofílico del fenol', 'Intermedio tetraédrico', 'Pérdida de ácido acético', 'Desprotonación → aspirina'];
  function stages() {
    return [
      ['Reactivos y reacción', 'Reacción', 'Ácido salicílico + anhídrido acético → ácido acetilsalicílico + ácido acético',
        '<p>La <b>aspirina</b> (ácido acetilsalicílico) se obtiene por <b>acetilación</b> del grupo fenólico del <b>ácido salicílico</b> con <b>anhídrido acético</b>, con un ácido (H₂SO₄ o H₃PO₄) como catalizador. Es una <b>sustitución nucleofílica acílica</b>: el –OH ataca un C=O del anhídrido. Se forma ácido acético como subproducto.</p>'],
      ['Mecanismo', 'Mecanismo', 'Protonación → ataque → intermedio tetraédrico → pérdida de AcOH → desprotonación',
        '<p>1) El ácido protona un C=O del anhídrido y lo activa. 2) El <b>oxígeno fenólico</b> ataca ese carbono. 3) Se forma un <b>intermedio tetraédrico</b>. 4) Se expulsa <b>ácido acético</b> (buen grupo saliente) y 5) se pierde el H⁺ del oxígeno: queda el <b>éster</b>. Usa el control de pasos para recorrerlo.</p>'],
      ['Reactivo limitante y rendimiento', 'Rendimiento', 'Rendimiento teórico según el reactivo limitante; real < teórico',
        '<p>El anhídrido se usa en <b>exceso</b>; el <b>reactivo limitante</b> es el ácido salicílico. El <b>rendimiento teórico</b> es n(limitante) × M(aspirina). El real es menor por reacción incompleta y por pérdidas en la <b>recristalización</b>: <b>% rendimiento = real/teórico × 100</b>.</p>'],
      ['Temperatura, tiempo y catalizador', 'Condiciones', 'Más temperatura y catalizador aceleran la acetilación',
        '<p>La velocidad sube con la <b>temperatura</b> (Arrhenius) y con el <b>catalizador ácido</b>. Un tiempo corto deja ácido salicílico sin reaccionar. Pero sobre ~90 °C aumentan las reacciones secundarias y la descomposición. Ajusta T, tiempo y catalizador y observa el rendimiento.</p>'],
      ['Prueba de pureza con FeCl₃', 'Pureza', 'El fenol libre da color violeta con Fe³⁺',
        '<p>El <b>ácido salicílico</b> tiene un –OH fenólico y forma un complejo <b>violeta con FeCl₃</b>; la aspirina pura, sin fenol libre, <b>no da color</b>. Un color violeta intenso indica acetilación incompleta o hidrólisis. Compara condiciones.</p>']
    ];
  }
  var def = {
    key: 'sintesis-aspirina', title: 'Síntesis de la aspirina', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [14, 4, 22], target: [14, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [14, 1, 26], target: [14, 1, 0] }],
    layers: [{ id: 'cryst', label: 'Cristales', icon: '◇' }],
    build: function (ctx) {
      g = new T.Group(); g.scale.setScalar(0.82); g.position.set(3, 0, 0); ctx.scene.add(g); gl = new T.Group(); gr = new T.Group(); g.add(gl); g.add(gr); gl.position.set(11, 4, 0); gr.position.set(26, 4, 0);
      gl.add(ctx.mol(ring(0), { gs: 0.9, ar: 0.55 })); gr.add(ctx.mol(ring(1), { gs: 0.9, ar: 0.55 }));
      var arr = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 5, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); arr.rotation.z = Math.PI / 2; arr.position.set(18.5, 4, 0); g.add(arr); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.set(21.4, 4, 0); g.add(hd);
      for (var i = 0; i < 60; i++) { var c = new T.Mesh(new T.OctahedronGeometry(0.28), new T.MeshStandardMaterial({ color: 0xf8f9fa })); g.add(c); cr.push(c); }
      tube = new T.Mesh(new T.CylinderGeometry(1, 1, 4, 18, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); tube.position.set(31, -3, 0); g.add(tube);
      tubeLiq = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 2.6, 18), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); tubeLiq.position.set(31, -3.6, 0); g.add(tubeLiq);
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.ms = 2; S.vac = 5; S.tc = 75; S.t = 15; S.cat = 1; } if (i === 1) { S.mech = Math.min(4, Math.floor(f.local * 5)); } if (i === 2) { S.ms = 1 + 3 * f.local; } if (i === 3) { S.ms = 2; S.tc = 40 + 55 * f.local; S.t = 5 + 25 * f.local; S.cat = 1; } if (i === 4) { S.tc = 75; S.t = 3 + 27 * f.local; S.cat = 1; } }
      gl.rotation.y += 0.004; gr.rotation.y += 0.004; var cv = conv(), n = Math.round(60 * Math.min(1, mReal() / 5)), on = ctx.layer('cryst');
      cr.forEach(function (c, j) { c.visible = on && j < n; var a = j * 2.4; c.position.set(25 + Math.cos(a) * (0.4 + (j % 6) * 0.35), -4 + (j % 5) * 0.18, Math.sin(a) * (0.4 + (j % 6) * 0.35)); c.rotation.set(j, j * 2, 0); });
      var viol = 1 - purity(); tubeLiq.material.color.set('#f1f3f5').lerp(new T.Color('#6741d9'), Math.min(1, viol * 3)); tubeLiq.material.opacity = 0.35 + 0.5 * Math.min(1, viol * 3);
      lab[0].pos(12.02, 7.05, 0).set('Ácido salicílico · ' + fmt(S.ms, 2) + ' g', 'bl-lead').vis(true);
      lab[1].pos(24.32, 7.05, 0).set('Ácido acetilsalicílico · ' + fmt(mReal(), 2) + ' g', 'bl-pos').vis(true);
      lab[2].pos(18.17, 4.43, 0).set('Ac₂O (' + fmt(S.vac, 1) + ' mL), H⁺, ' + fmt(S.tc, 0) + ' °C', 'bl-d').vis(true);
      lab[3].pos(18.17, 2.13, 0).set('conversión ' + fmt(cv * 100, 0) + ' %', 'bl-d').vis(true);
      lab[4].pos(21.5, -5.1, 0).set('% rendimiento: ' + fmt(pct(), 0) + ' %', 'bl-d').vis(true);
      lab[5].pos(27.5, -7.2, 0).set('FeCl₃: ' + (viol * 3 > 0.35 ? 'violeta (impuro)' : 'sin color (puro)'), viol * 3 > 0.35 ? 'bl-neg' : 'bl-pos').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; ['ms', 'vac', 'tc', 't', 'cat'].forEach(function (k2) { if (u[k2]) u[k2].set(S[k2]); }); },
    hud: function () { return { eq: { chip: '%', name: 'Rendimiento', body: '<div class="eqline"><small>Limitante</small>' + lim() + '</div><div class="eqline"><small>Teórico</small>' + fmt(mTeor(), 2) + ' g</div><div class="eqline"><small>Real</small>' + fmt(mReal(), 2) + ' g</div><div class="eqline"><small>Rendimiento</small>' + fmt(pct(), 0) + ' %</div>' }, legend: [{ label: 'Cristales blancos', color: '#f8f9fa', text: 'aspirina obtenida' }, { label: 'Tubo violeta', color: '#6741d9', text: 'fenol libre (FeCl₃)' }] }; },
    measures: function () { return [['n ác. salicílico', fmt(nS(), 2) + ' mmol'], ['n anhídrido', fmt(nA(), 1) + ' mmol'], ['Limitante', lim()], ['Teórico', fmt(mTeor(), 2) + ' g'], ['Real', fmt(mReal(), 2) + ' g'], ['Rendimiento', fmt(pct(), 0) + ' %'], ['Conversión', fmt(conv() * 100, 0) + ' %']]; },
    ideas: ['Acetilación del –OH fenólico.', 'Limitante: ácido salicílico.', '% = real/teórico × 100.', 'FeCl₃ violeta = fenol libre.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Condiciones de reacción'); el.appendChild(c);
      function sl(k2, l, a, b, st, fm) { ui[k2] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k2], format: fm, onInput: function (v) { ctx.goManual(); S[k2] = v; } }); return ui[k2]; }
      c.appendChild(kit.ui.sliders([sl('ms', 'Ácido salicílico', 0.5, 5, 0.1, function (v) { return fmt(v, 1) + ' g'; }), sl('vac', 'Anhídrido acético', 1, 10, 0.5, function (v) { return fmt(v, 1) + ' mL'; }), sl('tc', 'Temperatura', 25, 110, 1, function (v) { return v + ' °C'; }), sl('t', 'Tiempo', 1, 60, 1, function (v) { return v + ' min'; })]));
      ui.cat = kit.ui.options({ label: 'Catalizador ácido', cols: 2, value: S.cat, options: [{ v: 1, label: 'Con H₃PO₄' }, { v: 0, label: 'Sin catalizador' }], onChange: function (v) { ctx.goManual(); S.cat = +v; } }); c.appendChild(ui.cat);
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Conversión frente al tiempo', h: 200, note: 'Conversión = 1 − e^(−kt) a la temperatura elegida.', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B, i; cx.strokeStyle = '#ff8787'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 60; i++) { var v = 1 - Math.exp(-k() * i), x = L + pw * i / 60, y = Tp + ph * (1 - v); i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#ffd43b'; cx.beginPath(); cx.arc(L + pw * S.t / 60, Tp + ph * (1 - conv()), 5, 0, 6.28); cx.fill();
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('0', L, h - 8); cx.fillText('60 min', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('100 %', L - 4, Tp + 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">C₇H₆O₃ + (CH₃CO)₂O → C₉H₈O₄ + CH₃COOH</div><table class="calc-table">' + row('n ácido salicílico', fmt(S.ms, 2) + ' g / 138,12 = <b>' + fmt(nS(), 2) + ' mmol</b>') + row('n anhídrido', fmt(S.vac, 1) + ' mL × 1,08 g/mL / 102,09 = <b>' + fmt(nA(), 1) + ' mmol</b>') + row('Limitante', '<b>' + lim() + '</b>') + row('m teórica', fmt(nTeor(), 2) + ' mmol × 180,16 = <b>' + fmt(mTeor(), 2) + ' g</b>') + row('Conversión', '1 − e^(−' + fmt(k(), 3) + ' × ' + S.t + ') = <b>' + fmt(conv() * 100, 0) + ' %</b>') + row('m real estimada', '<b>' + fmt(mReal(), 2) + ' g</b> (con pérdidas del 15 % al recristalizar)') + row('% rendimiento', '<b>' + fmt(pct(), 0) + ' %</b>') + '</table>'; },
    quiz: [
      { q: 'El nucleófilo que ataca al anhídrido acético es…', options: ['el O del –OH fenólico', 'el C=O del ácido', 'el H₂O', 'el H⁺'], answer: 0, why: 'Forma el éster.' },
      { q: 'El reactivo limitante en la síntesis típica es…', options: ['el ácido salicílico', 'el anhídrido acético', 'el catalizador', 'el agua'], answer: 0, why: 'El anhídrido está en exceso.' },
      { q: 'Si se obtienen 1,8 g y el teórico es 2,6 g, el rendimiento es…', options: ['69 %', '144 %', '31 %', '100 %'], answer: 0, why: '1,8/2,6 × 100.' },
      { q: 'Un color violeta con FeCl₃ indica…', options: ['ácido salicílico sin reaccionar', 'aspirina pura', 'agua', 'catalizador'], answer: 0, why: 'Presencia de fenol libre.' },
      { q: 'El subproducto de la reacción es…', options: ['ácido acético', 'agua', 'CO₂', 'metanol'], answer: 0, why: 'Sale como grupo saliente.' },
      { q: 'Aumentar la temperatura de 50 a 75 °C…', options: ['aumenta la velocidad', 'reduce la velocidad', 'no la cambia', 'detiene la reacción'], answer: 0, why: 'Dependencia de Arrhenius.' }
    ],
    help: { intro: 'Ajusta cantidades, temperatura, tiempo y catalizador. Verás la masa de aspirina, el rendimiento y la prueba con FeCl₃.', items: [['Escena', 'cristales blancos = aspirina obtenida; tubo violeta = prueba de FeCl₃ positiva (queda fenol libre).'], ['Controles', 'cantidades de reactivos, temperatura, tiempo y «Catalizador ácido» (con H₃PO₄ o sin catalizador).'], ['Panel', 'masa de aspirina, reactivo limitante y rendimiento (% = real / teórico × 100).'], ['Gráfico', '«Conversión frente al tiempo».']], try: ['Quita el catalizador: la conversión avanza más lento.', 'Acorta el tiempo de reacción: la prueba de FeCl₃ se pone violeta por el ácido salicílico sin reaccionar.', 'Identifica el reactivo limitante: el ácido salicílico.'] }
  };
  MSim.create(def);
})();
