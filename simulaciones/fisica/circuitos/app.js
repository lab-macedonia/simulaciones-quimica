/* Circuitos eléctricos en serie y en paralelo — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var S = { mode: 'serie', n: 2, V: 6, R: 10, on: true, broken: false, ph: 0 };
  var G = {}, lab = {}, bulbs = [], dots = [], wires = [], XL = -3.2, XR = 3.6, YB = 0, YT = 3.2;
  function Req() { if (S.mode === 'serie') return S.n * S.R; return S.R / Math.max(1, S.n - (S.broken ? 1 : 0)); }
  function Itot() { if (!S.on) return 0; if (S.mode === 'serie' && S.broken) return 0; if (S.mode === 'paralelo' && S.broken && S.n === 1) return 0; return S.V / Req(); }
  function Ib(k) { if (!S.on) return 0; if (S.mode === 'serie') return S.broken ? 0 : Itot(); return (S.broken && k === 0) ? 0 : S.V / S.R; }
  function Vb(k) { if (S.mode === 'serie') return S.broken ? (k === 0 ? (S.on ? S.V : 0) : 0) : Ib(k) * S.R; return S.on ? S.V : 0; }
  function Pb(k) { return Ib(k) * Ib(k) * S.R; }
  function bulbPos(k) { if (S.mode === 'serie') { var xs = S.n === 1 ? [0.6] : S.n === 2 ? [-0.4, 1.8] : [-1.2, 0.6, 2.4]; return new T.Vector3(xs[k], YT, 0); } var xb = [-1.2, 0.6, 2.4]; return new T.Vector3(xb[k], (YB + YT) / 2, 0); }
  function paths() {
    var P = [], c = function (x, y) { return new T.Vector3(x, y, 0); };
    if (S.mode === 'serie') P.push({ pts: [c(XL, YB), c(XL, YT), c(XR, YT), c(XR, YB), c(XL, YB)], I: Itot() });
    else for (var k = 0; k < S.n; k++) { var x = bulbPos(k).x; P.push({ pts: [c(XL, YB), c(XL, YT), c(x, YT), c(x, YB), c(XL, YB)], I: Ib(k) }); }
    return P;
  }
  function along(pts, u) { var L = 0, seg = [], i; for (i = 1; i < pts.length; i++) { var d = pts[i].distanceTo(pts[i - 1]); seg.push(d); L += d; } var s = ((u % 1) + 1) % 1 * L; for (i = 0; i < seg.length; i++) { if (s <= seg[i]) return pts[i].clone().lerp(pts[i + 1], s / seg[i]); s -= seg[i]; } return pts[0].clone(); }
  function stages() {
    return [
      ['Circuito simple', 'Circuito', 'La corriente circula solo si el circuito está cerrado',
        '<p>Un <b>circuito eléctrico</b> tiene una <b>fuente</b> (pila o batería), <b>conductores</b> (cables), un <b>receptor</b> (ampolleta) y un <b>interruptor</b>. Solo con el circuito <b>cerrado</b> circula <b>corriente eléctrica</b>: un flujo de electrones (puntos azules) que la pila impulsa. Al abrir el interruptor la corriente se interrumpe en todo el circuito.</p>'],
      ['Ley de Ohm', 'Ohm', 'I = V/R: más voltaje, más corriente; más resistencia, menos corriente',
        '<p>El <b>voltaje</b> V (volt) es el «empuje» de la pila; la <b>resistencia</b> R (ohm, Ω) es la oposición del receptor; la <b>intensidad de corriente</b> I (ampere, A) es la carga que pasa por segundo. Se relacionan por la <b>ley de Ohm</b>: <b>I = V/R</b>. Al subir el voltaje la corriente aumenta y la ampolleta brilla más.</p>'],
      ['Circuito en serie', 'Serie', 'Una sola trayectoria: la misma corriente pasa por todas las ampolletas',
        '<p>En <b>serie</b> los receptores están uno tras otro: hay un <b>único camino</b> y la <b>misma corriente</b> pasa por todos. Las resistencias se suman, <b>R<sub>eq</sub> = R₁ + R₂ + …</b>, y el voltaje de la pila se <b>reparte</b> entre ellas. Con más ampolletas la corriente disminuye y todas brillan menos.</p>'],
      ['Circuito en paralelo', 'Paralelo', 'Varias trayectorias: cada ampolleta recibe el voltaje completo',
        '<p>En <b>paralelo</b> cada receptor está en su propia <b>rama</b>, conectada directamente a la pila: todos reciben el <b>mismo voltaje</b> y brillan como si estuvieran solos. La corriente total es la <b>suma</b> de las corrientes de las ramas y la resistencia equivalente es <b>menor</b> que la de cada receptor: 1/R<sub>eq</sub> = 1/R₁ + 1/R₂ + …</p>'],
      ['Si una ampolleta se funde', 'Fundida', 'En serie se apagan todas; en paralelo las demás siguen encendidas',
        '<p>Si una ampolleta se <b>funde</b>, su filamento se corta. En <b>serie</b> el único camino queda abierto y <b>se apagan todas</b>. En <b>paralelo</b> solo se interrumpe esa rama y <b>las demás siguen funcionando</b>. Por eso las instalaciones de las casas se conectan en paralelo: cada artefacto funciona de forma independiente.</p>'],
      ['Potencia eléctrica', 'Potencia', 'P = V·I: la energía que consume cada segundo un receptor',
        '<p>La <b>potencia eléctrica</b> es <b>P = V·I</b> (watt). Una ampolleta brilla más cuanto mayor es su potencia. La energía consumida es <b>E = P·t</b>; en las cuentas de la luz se mide en <b>kilowatt-hora</b> (kWh). Compara: tres ampolletas en paralelo consumen 9 veces más que tres en serie con la misma pila.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.R = 10; S.broken = false;
    if (i === 0) { S.mode = 'serie'; S.n = 1; S.V = 6; S.on = l > 0.25 && !(l > 0.6 && l < 0.8); }
    else if (i === 1) { S.mode = 'serie'; S.n = 1; S.on = true; S.V = 1.5 + 10.5 * l; }
    else if (i === 2) { S.mode = 'serie'; S.on = true; S.V = 6; S.n = l < 0.33 ? 1 : l < 0.66 ? 2 : 3; }
    else if (i === 3) { S.mode = 'paralelo'; S.on = true; S.V = 6; S.n = l < 0.33 ? 1 : l < 0.66 ? 2 : 3; }
    else if (i === 4) { S.on = true; S.V = 6; S.n = 3; S.mode = l < 0.5 ? 'serie' : 'paralelo'; S.broken = (l % 0.5) > 0.2; }
    else { S.on = true; S.V = 6; S.n = 3; S.mode = l < 0.5 ? 'serie' : 'paralelo'; }
  }
  function cyl(a, b, r, c) { var d = b.clone().sub(a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 8), new T.MeshStandardMaterial({ color: c, roughness: 0.5 })); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; }
  function rebuild() {
    wires.forEach(function (w) { G.root.remove(w); }); wires = [];
    var V = function (x, y) { return new T.Vector3(x, y, 0); }, add = function (a, b) { var w = cyl(a, b, 0.06, 0xd9480f); G.root.add(w); wires.push(w); };
    add(V(XL, YB), V(XL, YT));
    if (S.mode === 'serie') { add(V(XL, YT), V(XR, YT)); add(V(XR, YT), V(XR, YB)); add(V(XR, YB), V(XL, YB)); }
    else { var xm = bulbPos(S.n - 1).x; add(V(XL, YT), V(xm, YT)); add(V(XL, YB), V(xm, YB)); for (var k = 0; k < S.n; k++) { var x = bulbPos(k).x; add(V(x, YT), V(x, YB)); } }
    G.key = S.mode + S.n;
  }
  var def = {
    key: 'circuitos', title: 'Circuitos eléctricos en serie y en paralelo', subtitle: 'Simulador 3D · física', accent: { dark: '#ffa94d', light: '#d9480f' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-1.2, 4, 11], target: [-1.2, 2.2, 0] }, { id: 'frontal', label: 'Frontal', pos: [-1.2, 2.2, 11.5], target: [-1.2, 2, 0] }],
    layers: [{ id: 'e', label: 'Electrones en movimiento', icon: '•' }],
    build: function (ctx) {
      var s = ctx.scene; G.root = new T.Group(); s.add(G.root);
      var board = new T.Mesh(new T.BoxGeometry(8.6, 5.4, 0.2), new T.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.9 })); board.position.set(0.2, 1.6, -0.3); s.add(board);
      G.bat = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1.6, 20), new T.MeshStandardMaterial({ color: 0x1c7ed6, roughness: 0.4 })); G.bat.position.set(XL, (YB + YT) / 2, 0); s.add(G.bat);
      var tip = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.2, 12), new T.MeshStandardMaterial({ color: 0xced4da })); tip.position.set(XL, (YB + YT) / 2 + 0.9, 0); s.add(tip);
      G.sw = new T.Mesh(new T.BoxGeometry(0.9, 0.08, 0.12), new T.MeshStandardMaterial({ color: 0xf8f9fa })); s.add(G.sw);
      for (var k = 0; k < 3; k++) {
        var g = new T.Group(), glass = new T.Mesh(new T.SphereGeometry(0.42, 24, 16), new T.MeshStandardMaterial({ color: 0xe9ecef, emissive: 0xffc61a, emissiveIntensity: 0, transparent: true, opacity: 0.9 })), base = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.3, 12), new T.MeshStandardMaterial({ color: 0xadb5bd }));
        base.position.y = -0.45; g.add(glass); g.add(base); s.add(g); bulbs.push({ g: g, m: glass });
      }
      var dg = new T.SphereGeometry(0.07, 8, 6), dm = new T.MeshStandardMaterial({ color: 0x74c0fc, emissive: 0x1c4a7a });
      for (k = 0; k < 66; k++) { var d = new T.Mesh(dg, dm); d.visible = false; s.add(d); dots.push(d); }
      ['bat', 'b0', 'b1', 'b2', 'tot'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
      rebuild();
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      if (G.key !== S.mode + S.n) rebuild();
      S.ph += dt;
      var swx = S.mode === 'serie' ? 0.6 : -2.2; G.sw.position.set(swx, YB + (S.on ? 0 : 0.25), 0.05); G.sw.rotation.z = S.on ? 0 : 0.5;
      for (var k = 0; k < 3; k++) {
        var b = bulbs[k], vis = k < S.n; b.g.visible = vis; if (!vis) { lab['b' + k].vis(false); continue; }
        var p = bulbPos(k); b.g.position.copy(p); var P = Pb(k), br = clamp(P / 3.6, 0, 1.6);
        b.m.material.emissiveIntensity = br; b.m.material.color.setHex(S.broken && k === 0 ? 0x868e96 : 0xe9ecef);
        lab['b' + k].pos(p.x, p.y + (S.mode === 'serie' ? 0.95 : 0.8) + (k % 2) * 0.65, 0.3).set((S.broken && k === 0 ? 'Fundida · ' : '') + f1(Vb(k)) + ' V · ' + f2(Ib(k)) + ' A · ' + f2(P) + ' W', S.broken && k === 0 ? 'bl-warn' : 'bl-pos').vis(true);
      }
      lab.bat.pos(XL, YT + 0.8, 0).set('Pila ' + f1(S.V) + ' V', 'bl-lead').vis(true);
      lab.tot.pos(0.4, -0.9, 0).set(S.on ? 'I total = ' + f2(Itot()) + ' A · R eq = ' + f1(S.mode === 'serie' && S.broken ? Infinity : Req()) + ' Ω' : 'Circuito abierto: I = 0', S.on ? 'bl-d' : 'bl-warn').vis(true);
      // electrones
      var on = ctx.layer('e'), P = paths(), used = 0;
      P.forEach(function (pa, j) { var nd = Math.floor(66 / P.length); for (var q = 0; q < nd; q++) { var d = dots[used++]; if (!on || pa.I <= 0) { d.visible = false; continue; } d.visible = true; d.position.copy(along(pa.pts, q / nd - S.ph * pa.I * 0.25 + j * 0.013)); d.position.z = 0.12; } });
      for (; used < dots.length; used++) dots[used].visible = false;
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.n && u.n.set(S.n); u.V && u.V.set(S.V); u.R && u.R.set(S.R); } },
    hud: function () { return { eq: { chip: 'Ω', name: S.mode === 'serie' ? 'Circuito en serie' : 'Circuito en paralelo', body: '<div class="eqline"><small>Ohm</small>I = V / R</div><div class="eqline"><small>Serie</small>R = R₁ + R₂ + …</div><div class="eqline"><small>Paralelo</small>1/R = 1/R₁ + 1/R₂ + …</div><div class="eqline"><small>Potencia</small>P = V·I</div>' }, legend: [{ label: 'Puntos azules', color: '#74c0fc', text: 'electrones (su rapidez indica la corriente)' }, { label: 'Brillo', color: '#ffd43b', text: 'potencia de cada ampolleta' }] }; },
    measures: function () { var r = [['Conexión', S.mode === 'serie' ? 'serie' : 'paralelo'], ['Voltaje de la pila', f1(S.V) + ' V'], ['Ampolletas', S.n + ' × ' + f1(S.R) + ' Ω'], ['R equivalente', S.mode === 'serie' && S.broken ? '∞ (abierto)' : f2(Req()) + ' Ω'], ['Corriente total', f2(Itot()) + ' A'], ['Potencia total', f2(Itot() * (S.on ? S.V : 0)) + ' W']]; return r; },
    ideas: ['Sin circuito cerrado no hay corriente.', '<b>I = V/R</b> (ley de Ohm).', 'Serie: misma corriente; R se suman; el voltaje se reparte.', 'Paralelo: mismo voltaje; las corrientes se suman.', 'En las casas se usa paralelo.', '<b>P = V·I</b>; energía E = P·t (kWh).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Circuito'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Conexión', cols: 2, value: S.mode, options: [{ v: 'serie', label: 'Serie' }, { v: 'paralelo', label: 'Paralelo' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.n = kit.ui.options({ label: 'Número de ampolletas', cols: 3, value: S.n, options: [{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }], onChange: function (v) { ctx.goManual(); S.n = +v; } }); c.appendChild(ui.n);
      ui.V = kit.ui.slider({ label: 'Voltaje de la pila (V)', min: 1.5, max: 12, step: 0.5, value: S.V, onInput: function (v) { ctx.goManual(); S.V = v; } });
      ui.R = kit.ui.slider({ label: 'Resistencia de cada ampolleta (Ω)', min: 2, max: 30, step: 1, value: S.R, digits: 0, onInput: function (v) { ctx.goManual(); S.R = v; } });
      c.appendChild(kit.ui.sliders([ui.V, ui.R]));
      el.appendChild(ctx.btnRow([{ t: 'Abrir / cerrar interruptor', primary: true, fn: function () { ctx.goManual(); S.on = !S.on; } }, { t: 'Fundir / reparar ampolleta 1', fn: function () { ctx.goManual(); S.broken = !S.broken; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Ley de Ohm: corriente frente a voltaje', h: 220, note: 'Recta de pendiente 1/R<sub>eq</sub>. Serie (más resistencia): recta menos inclinada; paralelo: más inclinada.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, Im = 12 / (S.R / 3), sx = function (v) { return L + pw * v / 12; }, sy = function (i) { return Tp + ph - ph * Math.min(i, Im) / Im; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(Im * i / 4)); cx.lineTo(L + pw, sy(Im * i / 4)); cx.stroke(); cx.fillText(fmt(Im * i / 4, 1), L - 5, sy(Im * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 12; i += 3) cx.fillText(i, sx(i), h - B + 13); cx.fillText('V (V)  ·  I (A)', L + pw / 2, h - 3);
        [['serie', '#4dabf7'], ['paralelo', '#ff922b']].forEach(function (q) { var Re = q[0] === 'serie' ? S.n * S.R : S.R / S.n; cx.strokeStyle = q[1]; cx.lineWidth = q[0] === S.mode ? 3 : 1.5; cx.beginPath(); cx.moveTo(sx(0), sy(0)); cx.lineTo(sx(12), sy(12 / Re)); cx.stroke(); }); cx.lineWidth = 1;
        cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.V), sy(Itot()), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Potencia de cada ampolleta', h: 190, note: 'El brillo depende de la potencia P = V·I = I²·R.', draw: function (cx, w, h, col) {
        var Pm = Math.max(1, S.V * S.V / S.R), bw = (w - 60) / 3; cx.font = '11px system-ui'; cx.textAlign = 'center';
        for (var k = 0; k < 3; k++) { var P = k < S.n ? Pb(k) : 0, bh = (h - 50) * P / Pm, x = 30 + k * bw + bw * 0.15; cx.fillStyle = k < S.n ? '#fab005' : 'rgba(127,127,127,.2)'; cx.fillRect(x, h - 26 - bh, bw * 0.7, bh); cx.fillStyle = col.ink; cx.fillText((k + 1) + ' · ' + fmt(P, 2) + ' W', x + bw * 0.35, h - 10); }
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, R = S.R, n = S.n;
      var h = '<div class="card-kicker">' + (S.mode === 'serie' ? 'Serie' : 'Paralelo') + ' · ' + n + ' × ' + f1(R) + ' Ω · ' + f1(S.V) + ' V</div><div class="calc-step">1 · Resistencia equivalente</div><table class="calc-table">' +
        row('R eq', S.mode === 'serie' ? n + ' · ' + f1(R) + ' = <b>' + f1(n * R) + ' Ω</b>' : f1(R) + ' / ' + n + ' = <b>' + f2(R / n) + ' Ω</b>') + '</table>' +
        '<div class="calc-step">2 · Corrientes y voltajes</div><table class="calc-table">' + row('I total = V/R eq', '<b>' + f2(S.V / (S.mode === 'serie' ? n * R : R / n)) + ' A</b>') +
        row('Cada ampolleta', S.mode === 'serie' ? 'I = ' + f2(S.V / (n * R)) + ' A · V = ' + f2(S.V / n) + ' V' : 'V = ' + f1(S.V) + ' V · I = ' + f2(S.V / R) + ' A') + '</table>' +
        '<div class="calc-step">3 · Potencia</div><table class="calc-table">' + row('Cada ampolleta', 'P = ' + f2(S.mode === 'serie' ? Math.pow(S.V / (n * R), 2) * R : S.V * S.V / R) + ' W') + row('Total', '<b>' + f2(S.mode === 'serie' ? S.V * S.V / (n * R) : n * S.V * S.V / R) + ' W</b>') + '</table>';
      return h;
    },
    quiz: [
      { q: 'Para que circule corriente, el circuito debe estar…', options: ['cerrado', 'abierto', 'cortado', 'sin pila'], answer: 0, why: 'Los electrones necesitan un camino completo.' },
      { q: 'Una ampolleta de 12 Ω conectada a 6 V lleva una corriente de…', options: ['0,5 A', '2 A', '72 A', '18 A'], answer: 0, why: 'I = V/R = 6/12.' },
      { q: 'En un circuito en serie, la corriente…', options: ['es la misma en todos los receptores', 'se reparte entre las ramas', 'es mayor en el primero', 'es cero en el último'], answer: 0, why: 'Hay un solo camino.' },
      { q: 'En un circuito en paralelo, cada receptor recibe…', options: ['el voltaje completo de la pila', 'una parte del voltaje', 'la misma corriente que la total', 'ningún voltaje'], answer: 0, why: 'Cada rama está conectada directamente a la pila.' },
      { q: 'Tres resistencias de 10 Ω en serie equivalen a…', options: ['30 Ω', '10 Ω', '3,3 Ω', '1000 Ω'], answer: 0, why: 'En serie se suman.' },
      { q: 'Dos resistencias de 10 Ω en paralelo equivalen a…', options: ['5 Ω', '20 Ω', '10 Ω', '100 Ω'], answer: 0, why: '1/R = 1/10 + 1/10 → R = 5 Ω.' },
      { q: 'En tu casa se funde una ampolleta y las demás siguen encendidas. La instalación está en…', options: ['paralelo', 'serie', 'cortocircuito', 'ninguna conexión'], answer: 0, why: 'En paralelo cada rama es independiente.' },
      { q: 'Un hervidor de 2000 W conectado a 220 V consume una corriente de…', options: ['≈ 9,1 A', '≈ 0,11 A', '440 A', '2220 A'], answer: 0, why: 'I = P/V = 2000/220.' }
    ],
    help: { intro: 'Elige en «Lab» la conexión (serie o paralelo), el número de ampolletas, el voltaje y la resistencia. Abre el interruptor o funde una ampolleta para ver qué ocurre.', items: [['Electrones', 'puntos azules; se mueven más rápido donde hay más corriente.'], ['Brillo', 'proporcional a la potencia de cada ampolleta.'], ['Etiquetas', 'voltaje, corriente y potencia de cada ampolleta.']], try: ['Agrega ampolletas en serie: ¿qué pasa con el brillo?', 'Haz lo mismo en paralelo y compara la corriente total.', 'Funde la ampolleta 1 en cada tipo de circuito.'] }
  };
  MSim.create(def);
})();
